-- Enable RLS for tables
ALTER TABLE law_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_summary ENABLE ROW LEVEL SECURITY;

-- Create policies allowing anon role to SELECT (read) all public data
-- This allows the application to display data while maintaining security structure

-- law_categories - allow anon to read
CREATE POLICY "Allow anon read law_categories"
ON law_categories FOR SELECT
USING (true);

-- laws - allow anon to read
CREATE POLICY "Allow anon read laws"
ON laws FOR SELECT
USING (true);

-- compliance_logs - allow anon to read
CREATE POLICY "Allow anon read compliance_logs"
ON compliance_logs FOR SELECT
USING (true);

-- communication_matrix - allow anon to read
CREATE POLICY "Allow anon read communication_matrix"
ON communication_matrix FOR SELECT
USING (true);

-- regulatory_documents - allow anon to read
CREATE POLICY "Allow anon read regulatory_documents"
ON regulatory_documents FOR SELECT
USING (true);

-- compliance_summary - allow anon to read
CREATE POLICY "Allow anon read compliance_summary"
ON compliance_summary FOR SELECT
USING (true);

-- Grant permissions on all sequences (for INSERT operations if needed)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
