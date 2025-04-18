CREATE OR REPLACE VIEW invoice_status_summary AS
SELECT 
  status,
  COUNT(*) AS total
FROM invoices
GROUP BY status;