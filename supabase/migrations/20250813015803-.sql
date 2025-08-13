-- Update RLS to allow treasury to view billing_reviews comments
DROP POLICY IF EXISTS billing_reviews_select_policy ON public.billing_reviews;

CREATE POLICY billing_reviews_select_policy
ON public.billing_reviews
FOR SELECT
USING (
  get_user_role(auth.uid()) = ANY (
    ARRAY['super_admin'::user_role_type, 'supervisor'::user_role_type, 'admin'::user_role_type, 'treasury'::user_role_type]
  )
);