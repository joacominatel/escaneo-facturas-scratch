# Mejores practicas para correcta migracion en el SQL
- En caso de crear un nuevo *modelo*, se debe agregar en `app/__init__.py`.
- Una vez creado se ejecutan los siguientes comandos:

```bash
flask db init  # Esto solo se hace la primera vez (en caso de que la carpeta migrations/ no este creada)
flask db migrate -m "{MENSAJE DE COMMIT}"
flask db upgrade # Sube a la base de datos los cambios
```

- Siempre generar migraciones mediante *comandos*.
- *NUNCA* editar manualmente las migraciones generadas automáticamente.
- Utilizar nombres descriptivos en los mensajes de migración (-m).
- Revisar los archivos generados automáticamente antes de aplicarlos (`flask db upgrade`).