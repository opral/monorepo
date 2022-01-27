-- Referencing the argument as $1 instead of `email` solves the ambiguity problem.

CREATE OR REPLACE FUNCTION public.get_user_id_from_email(
	email text)
    RETURNS uuid
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
    declare
       uid uuid;
    begin
      select u.id
      into uid
      from public.user as u
      where u.email = $1;
      return uid;
    end;
$BODY$;

ALTER FUNCTION public.get_user_id_from_email(text)
    OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.get_user_id_from_email(text) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_user_id_from_email(text) TO anon;

GRANT EXECUTE ON FUNCTION public.get_user_id_from_email(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_id_from_email(text) TO postgres;

GRANT EXECUTE ON FUNCTION public.get_user_id_from_email(text) TO service_role;
