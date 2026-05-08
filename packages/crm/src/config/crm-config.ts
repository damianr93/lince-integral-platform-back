export function getCrmEnvs(get: (key: string) => string | undefined) {
  return {
    EXTERNAL_FIXED_TOKEN: get('EXTERNAL_FIXED_TOKEN') ?? '',
    CRM_ADVISORS: (get('CRM_ADVISORS') ?? 'EZEQUIEL,DENIS,MARTIN,JULIAN')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    FOLLOW_UP_AUTOMATION_ENABLED: (get('FOLLOW_UP_AUTOMATION_ENABLED') ?? 'false') === 'true',
    MAILER_HOST: get('MAILER_HOST') ?? '',
    MAILER_PORT: parseInt(get('MAILER_PORT') ?? '587', 10),
    MAILER_SECURE: (get('MAILER_SECURE') ?? 'false') === 'true',
    MAILER_EMAIL: get('MAILER_EMAIL') ?? '',
    MAILER_SECRET_KEY: get('MAILER_SECRET_KEY') ?? '',
    FOLLOW_UP_NOTIFY_EZEQUIEL_EMAIL: get('CRM_ADVISOR_EZEQUIEL_EMAIL') ?? '',
    FOLLOW_UP_NOTIFY_DENIS_EMAIL: get('CRM_ADVISOR_DENIS_EMAIL') ?? '',
    FOLLOW_UP_NOTIFY_MARTIN_EMAIL: get('CRM_ADVISOR_MARTIN_EMAIL') ?? '',
    FOLLOW_UP_NOTIFY_JULIAN_EMAIL: get('CRM_ADVISOR_JULIAN_EMAIL') ?? '',
    FOLLOW_UP_NOTIFY_SIN_ASIGNAR_EMAIL: get('CRM_ADVISOR_SIN_ASIGNAR_EMAIL') ?? '',
    FOLLOW_UP_NOTIFY_DEFAULT_EMAIL: get('CRM_ADVISOR_DEFAULT_EMAIL') ?? '',
  };
}
