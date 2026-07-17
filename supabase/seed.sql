-- Optional sample data for local development. Run manually against a dev
-- project only — never against production. Photos are left empty; upload
-- real ones from the admin panel to see the gallery in action.
insert into public.properties
  (municipality, modality, title, description, price, bedrooms, bathrooms, construction_m2, parking_spots, neighborhood, status)
values
  ('Metepec', 'venta', 'Casa Residencial La Providencia', 'Casa en privada con vigilancia 24/7, cocina integral, jardín trasero y roof garden. A 5 min de Town Square Metepec.', 4850000, 3, 2.5, 245, 2, 'La Providencia', 'activa'),
  ('Toluca', 'venta', 'Depto Torre Alfa, Centro', 'Departamento moderno en el centro de Toluca, a pasos de Plaza Fray.', 2190000, 2, 2, 98, 1, 'Centro', 'activa'),
  ('Toluca', 'renta', 'Casa Col. Morelos', 'Casa amplia en colonia Morelos, ideal para familia.', 14500, 3, 2, 180, 2, 'Morelos', 'activa'),
  ('San Mateo Atenco', 'venta', 'Casa San Mateo Centro', 'Casa céntrica cerca del mercado de calzado.', 1980000, 2, 1.5, 120, 1, 'Centro', 'activa'),
  ('Calimaya', 'venta', 'Casa Valle de Calimaya', 'Casa tranquila con amplio jardín en Valle de Calimaya.', 3600000, 3, 2, 210, 2, 'Valle de Calimaya', 'activa');
