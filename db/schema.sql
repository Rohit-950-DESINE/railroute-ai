-- PostgreSQL schema (not needed to run the demo)
CREATE TABLE users (id BIGSERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE stations (id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, state TEXT,
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, is_major BOOLEAN DEFAULT false, is_complex BOOLEAN DEFAULT false);
CREATE INDEX ON stations (city); CREATE INDEX ON stations (name);
CREATE TABLE trains (id BIGSERIAL PRIMARY KEY, train_number TEXT UNIQUE NOT NULL, train_name TEXT NOT NULL, train_type TEXT NOT NULL, runs_on SMALLINT[]);
CREATE TABLE train_stops (train_id BIGINT REFERENCES trains(id), station_id BIGINT REFERENCES stations(id), sequence INT NOT NULL,
  arrival_min INT, departure_min INT, day_offset INT DEFAULT 0, PRIMARY KEY (train_id, sequence));
CREATE TABLE journeys (id BIGSERIAL PRIMARY KEY, search_id BIGINT, payload JSONB NOT NULL, data_source TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE saved_trips (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id), label TEXT, origin TEXT, destination TEXT, preferences JSONB, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE search_history (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id), origin TEXT, destination TEXT, travel_date DATE,
  preference TEXT, flexibility TEXT, options_found INT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE preferences (user_id BIGINT PRIMARY KEY REFERENCES users(id), preference TEXT DEFAULT 'best', flexibility TEXT DEFAULT 'balanced', travel_class TEXT DEFAULT 'ANY', extra JSONB);
