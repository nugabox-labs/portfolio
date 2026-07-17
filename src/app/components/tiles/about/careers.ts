export type CareerProject = {
  name: string;
  image: string;
  link?: string;
};

export type CareerSkill = {
  name: string;
  icon: string;
};

export type CareerEntry = {
  id: string;
  role: string;
  company: string;
  period: string;
  badge: string;
  current: boolean;
  logo: string;
  overview: string;
  myRole: string;
  projects: CareerProject[];
  skills: CareerSkill[];
};

export const careersData: CareerEntry[] = [];
