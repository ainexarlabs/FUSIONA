-- Retention policy for sensitive INE (ID) uploads: once a visit request is
-- resolved (confirmed or cancelled) and past a grace period, or if it was
-- never resolved after a longer period, delete the uploaded ID photos both
-- from Storage and from the visit_requests row.
--
-- Requires the "pg_cron" and "pg_net" extensions (enable them from the
-- Supabase dashboard: Database > Extensions), plus two secrets stored in
-- Vault (Database > Vault):
--   project_url          -> https://<project-ref>.supabase.co
--   service_role_key     -> the project's service_role key
-- Storage deletes go through the Storage REST API (not a raw DELETE on
-- storage.objects) because that is the only supported way to remove the
-- underlying file, not just its metadata row.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.cleanup_expired_ine_uploads()
returns void as $$
declare
  v_project_url text;
  v_service_key text;
  v_request record;
  v_retention_resolved interval := interval '7 days';
  v_retention_unresolved interval := interval '30 days';
begin
  select decrypted_secret into v_project_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_service_key from vault.decrypted_secrets where name = 'service_role_key';

  if v_project_url is null or v_service_key is null then
    raise notice 'cleanup_expired_ine_uploads: project_url / service_role_key not configured in Vault, skipping';
    return;
  end if;

  for v_request in
    select id, ine_front_path, ine_back_path
    from public.visit_requests
    where (status in ('confirmada', 'cancelada') and created_at < now() - v_retention_resolved)
       or (status = 'pendiente' and created_at < now() - v_retention_unresolved)
  loop
    perform net.http_delete(
      url := v_project_url || '/storage/v1/object/ine-uploads/' || v_request.ine_front_path,
      headers := jsonb_build_object('Authorization', 'Bearer ' || v_service_key)
    );
    perform net.http_delete(
      url := v_project_url || '/storage/v1/object/ine-uploads/' || v_request.ine_back_path,
      headers := jsonb_build_object('Authorization', 'Bearer ' || v_service_key)
    );

    update public.visit_requests
      set ine_front_path = '', ine_back_path = ''
      where id = v_request.id;
  end loop;
end;
$$ language plpgsql security definer;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup-expired-ine-uploads') then
    perform cron.schedule(
      'cleanup-expired-ine-uploads',
      '0 4 * * *',
      $cron$select public.cleanup_expired_ine_uploads();$cron$
    );
  end if;
end;
$$;
