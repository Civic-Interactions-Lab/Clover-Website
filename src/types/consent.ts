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
  principalInvestigator: string;
  institution: string;
  irbProtocol: string;
  email?: string;
  phone?: string;
  faculty?: string;
  createdAt: string;
  updatedAt: string;
  blocks: ConsentFormBlock[];
}
