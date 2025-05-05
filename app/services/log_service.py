from app.core.extensions import db
from app.models.invoice_log import InvoiceLog, LogLevel, LogCategory
import inspect
import traceback
import logging
from flask import request, has_request_context, g
import threading
from sqlalchemy.exc import SQLAlchemyError

# Configurar logger para consola
logger = logging.getLogger("app.log_service")

# Semáforo para operaciones de log que no son thread-safe
log_lock = threading.Lock()

class LogService:
    """
    Servicio centralizado para la gestión de logs del sistema.
    Proporciona métodos para registrar eventos a nivel de aplicación y factura.
    """
    
    @staticmethod
    def get_origin():
        """Intenta determinar el origen (clase/función) del log basado en el stack de llamadas"""
        stack = inspect.stack()
        # Ignorar este método y el método de log que lo llamó
        if len(stack) > 2:
            caller = stack[2]
            try:
                if 'self' in caller.frame.f_locals:
                    # Es un método de clase
                    return f"{caller.frame.f_locals['self'].__class__.__name__}.{caller.function}"
                else:
                    # Es una función
                    return f"{caller.filename.split('/')[-1]}:{caller.function}"
            except:
                pass
        return "unknown"
    
    @staticmethod
    def get_client_ip():
        """Obtiene la IP del cliente en el contexto de una solicitud Flask"""
        if not has_request_context():
            return None
        
        if request.headers.get('X-Forwarded-For'):
            # Si hay proxy, tomar la primera IP (la del cliente original)
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        return request.remote_addr
    
    @staticmethod
    def get_current_user_id():
        """Obtiene el ID del usuario actual del contexto de Flask"""
        if has_request_context() and hasattr(g, 'user'):
            return getattr(g.user, 'id', None)
        return None
    
    @classmethod
    def _add_log(cls, invoice_id, event, level, category, details, origin=None, extra=None, ip_address=None):
        """
        Método interno para añadir un log a la base de datos.
        Maneja la transacción y excepciones.
        """
        if origin is None:
            origin = cls.get_origin()
            
        if ip_address is None and has_request_context():
            ip_address = cls.get_client_ip()
        
        # Asegurar que extra es None o un dict serializable
        if extra is not None and not isinstance(extra, dict):
            extra = {"data": str(extra)}
            
        # Convertir objetos de base de datos a diccionarios si están en extra
        if extra:
            for key, value in extra.items():
                if hasattr(value, '__table__'):  # Es un modelo SQLAlchemy
                    try:
                        extra[key] = {c.name: getattr(value, c.name) for c in value.__table__.columns}
                    except:
                        extra[key] = str(value)
        
        # Log a consola primero
        log_msg = f"[{level.upper()}] [{category}] Invoice {invoice_id}: {event} - {details}"
        console_logger = getattr(logger, level.lower(), logger.info)
        console_logger(log_msg)
        
        # Crear el objeto de log
        log_entry = InvoiceLog(
            invoice_id=invoice_id,
            event=event,
            level=level,
            category=category,
            origin=origin,
            details=details,
            ip_address=ip_address
        )
        
        if extra:
            log_entry.extra = extra
        
        # Asegurar que solo un hilo modifica la sesión a la vez
        with log_lock:
            session = db.session()
            try:
                session.add(log_entry)
                session.commit()
                return log_entry
            except SQLAlchemyError as e:
                session.rollback()
                error_msg = f"Error al guardar log en BD: {str(e)}"
                logger.error(error_msg)
                # Intentar guardar un log de error en la base de datos
                try:
                    error_log = InvoiceLog(
                        invoice_id=invoice_id,
                        event="log_error",
                        level=LogLevel.ERROR,
                        category=LogCategory.DATABASE,
                        origin="LogService._add_log",
                        details=error_msg
                    )
                    session.add(error_log)
                    session.commit()
                except:
                    logger.error("Error crítico: No se pudo guardar el log de error en la base de datos")
                return None
            except Exception as e:
                session.rollback()
                logger.error(f"Error inesperado al guardar log: {str(e)}")
                return None
            finally:
                session.close()
    
    # Métodos públicos para diferentes niveles de log
    
    @classmethod
    def debug(cls, invoice_id, event, details, category=LogCategory.PROCESS, origin=None, extra=None):
        """Registra un log de nivel DEBUG"""
        return cls._add_log(invoice_id, event, LogLevel.DEBUG, category, details, origin, extra)
    
    @classmethod
    def info(cls, invoice_id, event, details, category=LogCategory.PROCESS, origin=None, extra=None):
        """Registra un log de nivel INFO"""
        return cls._add_log(invoice_id, event, LogLevel.INFO, category, details, origin, extra)
    
    @classmethod
    def warning(cls, invoice_id, event, details, category=LogCategory.PROCESS, origin=None, extra=None):
        """Registra un log de nivel WARNING"""
        return cls._add_log(invoice_id, event, LogLevel.WARNING, category, details, origin, extra)
    
    @classmethod
    def error(cls, invoice_id, event, details, category=LogCategory.PROCESS, origin=None, extra=None, exc_info=None):
        """
        Registra un log de nivel ERROR
        
        Args:
            exc_info: Excepción actual (opcional, se captura automáticamente si es None)
        """
        if exc_info is None:
            exc_info = traceback.format_exc() if traceback.format_exc() != 'NoneType: None\n' else None
            
        if exc_info and isinstance(extra, dict):
            extra['traceback'] = exc_info
        elif exc_info:
            extra = {'traceback': exc_info}
            
        return cls._add_log(invoice_id, event, LogLevel.ERROR, category, details, origin, extra)
    
    @classmethod
    def critical(cls, invoice_id, event, details, category=LogCategory.SYSTEM, origin=None, extra=None, exc_info=None):
        """Registra un log de nivel CRITICAL"""
        if exc_info is None:
            exc_info = traceback.format_exc() if traceback.format_exc() != 'NoneType: None\n' else None
            
        if exc_info and isinstance(extra, dict):
            extra['traceback'] = exc_info
        elif exc_info:
            extra = {'traceback': exc_info}
            
        return cls._add_log(invoice_id, event, LogLevel.CRITICAL, category, details, origin, extra)
    
    # Métodos especializados para casos comunes
    
    @classmethod
    def process_start(cls, invoice_id, process_name, details=None, extra=None):
        """Registra el inicio de un proceso"""
        details = details or f"Iniciando proceso: {process_name}"
        return cls.info(invoice_id, f"{process_name}_started", details, LogCategory.PROCESS, extra=extra)
    
    @classmethod
    def process_end(cls, invoice_id, process_name, details=None, duration=None, extra=None):
        """Registra el fin de un proceso"""
        if duration is not None:
            details = details or f"Proceso completado en {duration:.2f} segundos"
            if extra is None:
                extra = {}
            extra['duration_seconds'] = duration
        else:
            details = details or f"Proceso completado: {process_name}"
            
        return cls.info(invoice_id, f"{process_name}_completed", details, LogCategory.PROCESS, extra=extra)
    
    @classmethod
    def process_error(cls, invoice_id, process_name, error, details=None, extra=None):
        """Registra un error en un proceso"""
        details = details or f"Error en proceso {process_name}: {str(error)}"
        return cls.error(invoice_id, f"{process_name}_error", details, LogCategory.PROCESS, extra=extra, exc_info=error)
    
    @classmethod
    def status_change(cls, invoice_id, old_status, new_status, details=None, extra=None):
        """Registra un cambio de estado en una factura"""
        details = details or f"Cambio de estado: {old_status} → {new_status}"
        if extra is None:
            extra = {}
        extra.update({
            'old_status': old_status,
            'new_status': new_status
        })
        return cls.info(invoice_id, "status_changed", details, LogCategory.PROCESS, extra=extra)
    
    @classmethod
    def api_call(cls, invoice_id, endpoint, method, status_code, details=None, extra=None):
        """Registra una llamada a la API"""
        details = details or f"Llamada a API: {method} {endpoint} - Código: {status_code}"
        if extra is None:
            extra = {}
        extra.update({
            'endpoint': endpoint,
            'method': method,
            'status_code': status_code
        })
        # Nivel de log basado en el código de estado
        level = LogLevel.INFO if status_code < 400 else LogLevel.ERROR
        return cls._add_log(invoice_id, "api_call", level, LogCategory.API, details, extra=extra)
    
    @classmethod
    def worker_task(cls, invoice_id, task_name, status, details=None, extra=None):
        """Registra información sobre una tarea de worker (Celery)"""
        details = details or f"Tarea {task_name}: {status}"
        return cls.info(invoice_id, f"worker_{status}", details, LogCategory.WORKER, extra=extra) 