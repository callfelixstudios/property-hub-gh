-- Create safemove transactions table
CREATE TABLE public.safemove_transactions (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  tenant_id uuid references public.profiles(id) on delete cascade not null,
  landlord_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'deposit_locked', -- 'deposit_locked', 'gps_pending', 'scheduled_handover', 'completed'
  transaction_amount numeric not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE public.safemove_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Landlords and Tenants can view their transactions
CREATE POLICY "Users can view their safemove transactions" 
  ON public.safemove_transactions FOR SELECT TO authenticated USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
