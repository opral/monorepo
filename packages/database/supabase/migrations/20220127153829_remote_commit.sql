-- Inlang started out with prisma as migration tool because of supabases lack of migrations.
-- This schema is the initial commit based on the prisma migrations. 

CREATE TYPE public.iso_639_1 AS ENUM
    ('ab', 'aa', 'af', 'ak', 'sq', 'am', 'ar', 'an', 'hy', 'as', 'av', 'ae', 'ay', 'az', 'bm', 'ba', 'eu', 'be', 'bn', 'bh', 'bi', 'bs', 'br', 'bg', 'my', 'ca', 'km', 'ch', 'ce', 'ny', 'zh', 'cu', 'cv', 'kw', 'co', 'cr', 'hr', 'cs', 'da', 'dv', 'nl', 'dz', 'en', 'eo', 'et', 'ee', 'fo', 'fj', 'fi', 'fr', 'ff', 'gd', 'gl', 'lg', 'ka', 'de', 'ki', 'el', 'kl', 'gn', 'gu', 'ht', 'ha', 'he', 'hz', 'hi', 'ho', 'hu', 'is', 'io', 'ig', 'id', 'ia', 'ie', 'iu', 'ik', 'ga', 'it', 'ja', 'jv', 'kn', 'kr', 'ks', 'kk', 'rw', 'kv', 'kg', 'ko', 'kj', 'ku', 'ky', 'lo', 'la', 'lv', 'lb', 'li', 'ln', 'lt', 'lu', 'mk', 'mg', 'ms', 'ml', 'mt', 'gv', 'mi', 'mr', 'mh', 'ro', 'mn', 'na', 'nv', 'nd', 'ng', 'ne', 'se', 'no', 'nb', 'nn', 'ii', 'oc', 'oj', 'or', 'om', 'os', 'pi', 'pa', 'ps', 'fa', 'pl', 'pt', 'qu', 'rm', 'rn', 'ru', 'sm', 'sg', 'sa', 'sc', 'sr', 'sn', 'sd', 'si', 'sk', 'sl', 'so', 'st', 'nr', 'es', 'su', 'sw', 'ss', 'sv', 'tl', 'ty', 'tg', 'ta', 'tt', 'te', 'th', 'bo', 'ti', 'to', 'ts', 'tn', 'tr', 'tk', 'tw', 'ug', 'uk', 'ur', 'uz', 've', 'vi', 'vo', 'wa', 'cy', 'fy', 'wo', 'xh', 'yi', 'yo', 'za', 'zu');

ALTER TYPE public.iso_639_1
    OWNER TO postgres;


CREATE TABLE IF NOT EXISTS public."user"
(
    id uuid NOT NULL,
    email text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.project
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    api_key uuid NOT NULL DEFAULT gen_random_uuid(),
    created_by_user_id uuid NOT NULL,
    base_language_code iso_639_1 NOT NULL,
    CONSTRAINT project_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.language
(
    project_id uuid NOT NULL,
    file text COLLATE pg_catalog."default" NOT NULL DEFAULT ''::text,
    code iso_639_1 NOT NULL,
    CONSTRAINT language_pkey PRIMARY KEY (project_id, code),
    CONSTRAINT language_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES public.project (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.project_member
(
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT project_member_pkey PRIMARY KEY (project_id, user_id),
    CONSTRAINT project_member_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES public.project (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT project_member_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public."user" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

TABLESPACE pg_default;

CREATE OR REPLACE FUNCTION public.is_member_of_project(
	project_id uuid)
    RETURNS boolean
    LANGUAGE 'sql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
        SELECT project_id IN (
            SELECT om.project_id
            FROM project_member om
            WHERE om.user_id = auth.uid()
        );
        
$BODY$;

ALTER FUNCTION public.is_member_of_project(uuid)
    OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.is_member_of_project(uuid) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_member_of_project(uuid) TO anon;

GRANT EXECUTE ON FUNCTION public.is_member_of_project(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_member_of_project(uuid) TO postgres;

GRANT EXECUTE ON FUNCTION public.is_member_of_project(uuid) TO service_role;

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
      where u.email = email;
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

CREATE OR REPLACE FUNCTION public.handle_insert_user()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF SECURITY DEFINER
AS $BODY$
    begin
        insert into public.user (id, email)
        values (new.id, new.email);
        return new;
    end;
    
$BODY$;

ALTER FUNCTION public.handle_insert_user()
    OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.handle_insert_user() TO authenticated;

GRANT EXECUTE ON FUNCTION public.handle_insert_user() TO postgres;

GRANT EXECUTE ON FUNCTION public.handle_insert_user() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public.handle_insert_user() TO anon;

GRANT EXECUTE ON FUNCTION public.handle_insert_user() TO service_role;

CREATE OR REPLACE FUNCTION public.handle_insert_project()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF SECURITY DEFINER
AS $BODY$
    BEGIN
        insert into public.project_member (project_id, user_id)
        values (new.id, new.created_by_user_id);
        return new;
    END;
    
$BODY$;

ALTER FUNCTION public.handle_insert_project()
    OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.handle_insert_project() TO authenticated;

GRANT EXECUTE ON FUNCTION public.handle_insert_project() TO postgres;

GRANT EXECUTE ON FUNCTION public.handle_insert_project() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public.handle_insert_project() TO anon;

GRANT EXECUTE ON FUNCTION public.handle_insert_project() TO service_role;

ALTER TABLE IF EXISTS public.project_member
    OWNER to postgres;

ALTER TABLE IF EXISTS public.project_member
    ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.project_member TO authenticated;

GRANT ALL ON TABLE public.project_member TO anon;

GRANT ALL ON TABLE public.project_member TO service_role;

GRANT ALL ON TABLE public.project_member TO postgres;
CREATE POLICY "user can act on records if member"
    ON public.project_member
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (is_member_of_project(project_id));


ALTER TABLE IF EXISTS public."user"
    OWNER to postgres;

ALTER TABLE IF EXISTS public."user"
    ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public."user" TO anon;

GRANT ALL ON TABLE public."user" TO authenticated;

GRANT ALL ON TABLE public."user" TO postgres;

GRANT ALL ON TABLE public."user" TO service_role;
CREATE UNIQUE INDEX IF NOT EXISTS user_email_key
    ON public."user" USING btree
    (email COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
CREATE POLICY "user select user"
    ON public."user"
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((id IN ( SELECT project_member.user_id
   FROM project_member)));
CREATE POLICY "user update user"
    ON public."user"
    AS PERMISSIVE
    FOR UPDATE
    TO public
    USING ((auth.uid() = id));


ALTER TABLE IF EXISTS public.project
    OWNER to postgres;

ALTER TABLE IF EXISTS public.project
    ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.project TO anon;

GRANT ALL ON TABLE public.project TO authenticated;

GRANT ALL ON TABLE public.project TO postgres;

GRANT ALL ON TABLE public.project TO service_role;
CREATE UNIQUE INDEX IF NOT EXISTS project_api_key_key
    ON public.project USING btree
    (api_key ASC NULLS LAST)
    TABLESPACE pg_default;
CREATE POLICY "user can insert project"
    ON public.project
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((auth.uid() = created_by_user_id));
CREATE POLICY "user can select project before membership has been inserted"
    ON public.project
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((auth.uid() = created_by_user_id));
CREATE POLICY user_can_act_on_projects_if_member
    ON public.project
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((id IN ( SELECT project_member.project_id
   FROM project_member
  WHERE (project_member.user_id = auth.uid()))));

CREATE TRIGGER on_project_insert
    AFTER INSERT
    ON public.project
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_insert_project();

CREATE TABLE IF NOT EXISTS public._prisma_migrations
(
    id character varying(36) COLLATE pg_catalog."default" NOT NULL,
    checksum character varying(64) COLLATE pg_catalog."default" NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    logs text COLLATE pg_catalog."default",
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    applied_steps_count integer NOT NULL DEFAULT 0,
    CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public._prisma_migrations
    OWNER to postgres;

GRANT ALL ON TABLE public._prisma_migrations TO anon;

GRANT ALL ON TABLE public._prisma_migrations TO authenticated;

GRANT ALL ON TABLE public._prisma_migrations TO postgres;

GRANT ALL ON TABLE public._prisma_migrations TO service_role;


ALTER TABLE IF EXISTS public.language
    OWNER to postgres;

ALTER TABLE IF EXISTS public.language
    ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.language TO anon;

GRANT ALL ON TABLE public.language TO authenticated;

GRANT ALL ON TABLE public.language TO postgres;

GRANT ALL ON TABLE public.language TO service_role;
CREATE POLICY "user can act on language if project member"
    ON public.language
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((project_id IN ( SELECT project.id
   FROM (project_member
     LEFT JOIN project ON ((project_member.user_id = auth.uid()))))));

-- Type: iso_639_1

-- DROP TYPE IF EXISTS public.iso_639_1;