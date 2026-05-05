-- Limpiar todas las cuentas de cobro y contratos para empezar de cero
TRUNCATE TABLE 
  public.billing_activity_evidence,
  public.billing_activities,
  public.billing_documents,
  public.billing_reviews,
  public.historial_estado_cuenta,
  public.billing_accounts,
  public.contract_payments,
  public.contract_state_history,
  public.documents,
  public.contracts
RESTART IDENTITY CASCADE;