-- Carefull, this trigger is not covered by supabases diffing because it's 
-- not in the 'public' schema. Therefore, this migration has been added manually.

CREATE OR REPLACE FUNCTION public.handle_insert_user_schema_auth()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE SECURITY DEFINER
    COST 100
AS $BODY$
    begin
        insert into public.user (id, email)
        values (new.id, new.email);
        return new;
    end;
    
$BODY$;

DROP TRIGGER IF EXISTS on_insert_user_schema_auth on auth.users;
CREATE TRIGGER on_insert_user_schema_auth
    AFTER INSERT
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_insert_user_schema_auth();
