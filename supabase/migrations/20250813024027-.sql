-- Create index for performance on billing reviews
CREATE INDEX IF NOT EXISTS ix_billing_reviews_account_created
ON public.billing_reviews (billing_account_id, created_at DESC);

-- Create view with the last review per billing account
CREATE OR REPLACE VIEW public.v_billing_accounts_last_review AS
SELECT
  ba.id,
  ba.account_number         AS numero,
  ba.contract_id,
  TO_CHAR(ba.billing_month, 'Month YYYY') AS periodo,
  ba.amount                 AS valor,
  ba.status                 AS estado,
  ba.created_at             AS fecha,
  
  lr.last_comment,
  lr.last_decision,
  lr.last_review_at
FROM public.billing_accounts AS ba
LEFT JOIN LATERAL (
  SELECT
    COALESCE(br.comentario, br.comments) AS last_comment,
    br.decision                          AS last_decision,
    br.created_at                        AS last_review_at
  FROM public.billing_reviews br
  WHERE br.billing_account_id = ba.id
  ORDER BY br.created_at DESC
  LIMIT 1
) AS lr ON TRUE
ORDER BY ba.created_at DESC;

-- Grant SELECT permissions on the view (inherits from base tables)
GRANT SELECT ON public.v_billing_accounts_last_review TO authenticated;