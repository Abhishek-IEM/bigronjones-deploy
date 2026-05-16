-- Initial three lead magnets. Re-runnable thanks to the unique(slug) constraint.
insert into public.lead_magnets
  (slug, title, description, pdf_url, category, email_subject, email_preview)
values
  (
    'mass-gain-guide',
    'Free Mass Gain Guide for Men 35+',
    'The exact framework Ron uses with his clients to build muscle without killing your joints. 7 pages. No fluff.',
    '/assets/pdfs/mass-gain-guide.pdf',
    'fitness',
    'Your Free Mass Gain Guide is here',
    'Everything you need to start building real muscle after 35'
  ),
  (
    'fat-loss-blueprint',
    'Fat Loss Blueprint: Lose Fat, Keep Muscle',
    'Why most fat loss advice fails men over 35 — and the practical system that actually works.',
    '/assets/pdfs/fat-loss-blueprint.pdf',
    'fitness',
    'Your Fat Loss Blueprint is ready',
    'The system Ron uses with 2,000+ clients'
  ),
  (
    'sleep-recovery-guide',
    'Sleep & Recovery Guide for Serious Results',
    'Ron''s sleep optimization framework. Fix your sleep, fix your results.',
    '/assets/pdfs/sleep-recovery-guide.pdf',
    'wellness',
    'Your Sleep & Recovery Guide is inside',
    'The missing piece most men over 35 ignore'
  )
on conflict (slug) do nothing;
