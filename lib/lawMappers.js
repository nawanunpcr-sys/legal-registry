export function mapCategory(category) {
  if (!category) return null

  return {
    ...category,
    name: category.name || category.name_th || category.name_en || category.id,
    color: category.color || '#3B82F6',
  }
}

export function mapLaw(law, categoryMap = new Map()) {
  if (!law) return null

  const category = categoryMap.get(law.category_id)

  return {
    ...law,
    law_code: law.law_code || law.id,
    description: law.description || law.summary,
    priority: law.priority || (law.compliance_status === 'NC' ? 'high' : 'normal'),
    status: law.status || (law.is_cancelled ? 'cancelled' : 'active'),
    responsible_person: law.responsible_person || law.responsible_unit,
    review_frequency: law.review_frequency || law.check_frequency,
    last_updated: law.last_updated || law.updated_at,
    law_categories: mapCategory(category),
    law_department_mapping: law.law_department_mapping || [],
  }
}
