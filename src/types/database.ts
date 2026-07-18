export type Modality = 'venta' | 'renta';
export type PropertyStatus = 'activa' | 'apartada' | 'pausada' | 'vendida' | 'rentada';
export type VisitStatus = 'pendiente' | 'confirmada' | 'cancelada';

export const ALL_PROPERTY_STATUSES: PropertyStatus[] = [
  'activa',
  'apartada',
  'pausada',
  'vendida',
  'rentada',
];

// Note: these use `type` (not `interface`) on purpose — the Database schema
// below needs each Row/Insert/Update to structurally satisfy
// Record<string, unknown> for supabase-js's generic constraints, which plain
// type-literal aliases do but interfaces do not.
export type MunicipalityCodeRow = {
  id: string;
  municipality: string;
  code: string;
  sale_suffix: string;
  rent_suffix: string;
  created_at: string;
  updated_at: string;
};

export type PropertyRow = {
  id: string;
  folio: string;
  municipality: string;
  modality: Modality;
  title: string;
  description: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  construction_m2: number | null;
  parking_spots: number | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
};

export type PropertyAreaRow = {
  id: string;
  property_id: string;
  area_name: string;
  order: number;
  created_at: string;
};

export type PropertyPhotoRow = {
  id: string;
  area_id: string;
  storage_path: string;
  order: number;
  created_at: string;
};

export type VisitRequestRow = {
  id: string;
  property_id: string;
  client_name: string;
  client_phone: string;
  requested_datetime: string;
  ine_front_path: string;
  ine_back_path: string;
  status: VisitStatus;
  calendar_event_id: string | null;
  created_at: string;
};

export type PropertyCatalogRow = PropertyRow & {
  cover_photo_path: string | null;
};

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: PropertyRow;
        Insert: Partial<PropertyRow> &
          Pick<PropertyRow, 'municipality' | 'modality' | 'title' | 'price'>;
        Update: Partial<PropertyRow>;
        Relationships: [];
      };
      municipality_codes: {
        Row: MunicipalityCodeRow;
        Insert: Partial<MunicipalityCodeRow> & Pick<MunicipalityCodeRow, 'municipality' | 'code'>;
        Update: Partial<MunicipalityCodeRow>;
        Relationships: [];
      };
      property_areas: {
        Row: PropertyAreaRow;
        Insert: Partial<PropertyAreaRow> & Pick<PropertyAreaRow, 'property_id' | 'area_name'>;
        Update: Partial<PropertyAreaRow>;
        Relationships: [
          {
            foreignKeyName: 'property_areas_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      property_photos: {
        Row: PropertyPhotoRow;
        Insert: Partial<PropertyPhotoRow> & Pick<PropertyPhotoRow, 'area_id' | 'storage_path'>;
        Update: Partial<PropertyPhotoRow>;
        Relationships: [
          {
            foreignKeyName: 'property_photos_area_id_fkey';
            columns: ['area_id'];
            isOneToOne: false;
            referencedRelation: 'property_areas';
            referencedColumns: ['id'];
          },
        ];
      };
      visit_requests: {
        Row: VisitRequestRow;
        Insert: Partial<VisitRequestRow> &
          Pick<
            VisitRequestRow,
            'property_id' | 'client_name' | 'client_phone' | 'requested_datetime' | 'ine_front_path' | 'ine_back_path'
          >;
        Update: Partial<VisitRequestRow>;
        Relationships: [
          {
            foreignKeyName: 'visit_requests_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      property_catalog: {
        Row: PropertyCatalogRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}
