import { getApiUrl } from "@/lib/env"

/**
 * Descarga una factura como archivo PDF
 * @param invoiceId ID de la factura a descargar
 * @param filename Nombre opcional para el archivo descargado
 */
export function downloadInvoice(invoiceId: number, filename?: string): void {
  // Construir la URL de descarga
  const downloadUrl = getApiUrl(`api/invoices/${invoiceId}/download`)

  // Crear un enlace temporal para la descarga
  const link = document.createElement("a")
  link.href = downloadUrl

  // Establecer el nombre del archivo si se proporciona
  if (filename) {
    link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`
  } else {
    link.download = `factura-${invoiceId}.pdf`
  }

  // Añadir el enlace al DOM, hacer clic y luego eliminarlo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
