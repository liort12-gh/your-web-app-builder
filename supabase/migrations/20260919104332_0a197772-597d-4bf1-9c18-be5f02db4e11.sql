REVOKE ALL ON FUNCTION public.is_app_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_approved_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_app_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_approved_member(uuid) TO authenticated, service_role;