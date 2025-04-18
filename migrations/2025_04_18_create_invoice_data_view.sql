CREATE OR REPLACE VIEW invoices_data AS
SELECT 
    i.id AS invoice_id,
    JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.invoice_number')) AS invoice_number,
    JSON_EXTRACT(i.final_data, '$.amount_total') AS amount_total,
    JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.date')) AS date,
    JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.bill_to')) AS bill_to,
    JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.currency')) AS currency,
    JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.payment_terms')) AS payment_terms,
    JSON_EXTRACT(i.final_data, '$.items') AS items
FROM invoices i
WHERE i.final_data IS NOT NULL;