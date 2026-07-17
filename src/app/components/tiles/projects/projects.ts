export const projectsData: {
  name: string;
  description: string;
  image: string;
  github: string | boolean;
  view?: string | boolean;
  workStatus?: boolean;
  date?: string;
  demo: boolean;
  personal?: boolean;
  tech: { name: string; image: string }[];
}[] = [];
