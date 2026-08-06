-- Update public.handle_new_user() trigger function to handle new user creation from Phone or Email,
-- populating the contact_phone column and setting a fallback name.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, contact_phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE
  SET contact_phone = COALESCE(EXCLUDED.contact_phone, public.profiles.contact_phone),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
