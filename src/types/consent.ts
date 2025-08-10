export interface ConsentFormBlock {
  id: string;
  formId: number;
  type: string;
  content: any;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentForm {
  id: number;
  title: string;
  subtitle: string;
  studyTitle: string;
  researchLead: string;
  institution: string;
  irbNumber: string;
  blocks: ConsentFormBlock[];
  createdAt: string;
  updatedAt: string;
}
