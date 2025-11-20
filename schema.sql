-- Enable PostGIS for location support (if needed, or just use lat/long floats for MVP)
-- create extension if not exists postgis;

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  karma_points int default 0,
  is_verified boolean default false,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Items table
create type item_status as enum ('lost', 'found', 'returned', 'archived');

create table public.items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  status item_status default 'lost',
  latitude float not null,
  longitude float not null,
  location_name text,
  image_url text,
  reward_amount decimal(10, 2) default 0,
  
  -- Found Item Details
  return_method text check (return_method in ('left_it', 'pickup', 'chat')),
  pickup_address text,
  is_free boolean default false,
  is_sample BOOLEAN DEFAULT FALSE,
  
  -- Mutual Resolution Fields
  claimed_by uuid references public.profiles(id),
  claim_timestamp timestamp with time zone,
  resolved_by_reporter boolean default false,
  resolved_by_claimer boolean default false,
  resolved_timestamp timestamp with time zone,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safe Havens table
create table public.safe_havens (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text not null,
  latitude float not null,
  longitude float not null,
  type text check (type in ('business', 'kiosk', 'police', 'other')),
  is_active boolean default true
);

-- Transactions/Claims table
create type transaction_status as enum ('pending', 'escrowed', 'completed', 'disputed', 'cancelled');

create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) not null,
  finder_id uuid references public.profiles(id) not null, -- The person claiming the reward
  loser_id uuid references public.profiles(id) not null, -- The owner of the item
  amount decimal(10, 2) not null,
  status transaction_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications Table
create type notification_type as enum ('claim', 'message', 'resolution');

create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null, -- Recipient
  type notification_type not null,
  item_id uuid references public.items(id),
  from_user_id uuid references public.profiles(id), -- Sender (optional, e.g. system msg)
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages Table (Chat)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) not null, -- Chat context
  sender_id uuid references public.profiles(id) not null,
  recipient_id uuid references public.profiles(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for new tables

-- Items
alter table public.items enable row level security;

create policy "Items are viewable by everyone."
  on public.items for select
  using ( true );

create policy "Users can insert their own items."
  on public.items for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own items."
  on public.items for update
  using ( auth.uid() = user_id );

-- Notifications
alter table public.notifications enable row level security;

create policy "Users can view their own notifications."
  on public.notifications for select
  using ( auth.uid() = user_id );

create policy "System/Users can insert notifications."
  on public.notifications for insert
  with check ( true ); -- Allow inserts (triggered by actions)

create policy "Users can update their own notifications (mark as read)."
  on public.notifications for update
  using ( auth.uid() = user_id );

-- Messages
alter table public.messages enable row level security;

create policy "Users can view messages sent to or by them."
  on public.messages for select
  using ( auth.uid() = sender_id or auth.uid() = recipient_id );

create policy "Users can send messages."
  on public.messages for insert
  with check ( auth.uid() = sender_id );


-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
