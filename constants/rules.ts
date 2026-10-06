export interface HostelRule {
  id: string;
  title: string;
}

export const HOSTEL_RULES: HostelRule[] = [
  {
    id: "visitors_allowed",
    title: "Visitors Allowed",
  },
  {
    id: "pets_allowed",
    title: "Pets Allowed",
  },
  {
    id: "cooking_allowed",
    title: "Cooking Allowed",
  },
  {
    id: "smoking_allowed",
    title: "Smoking Allowed",
  },
  {
    id: "music_allowed",
    title: "Loud Music Allowed",
  },
  {
    id: "generator_allowed",
    title: "Generator Allowed",
  },
  {
    id: "alcohol_allowed",
    title: "Alcohol Allowed",
  },
  {
    id: "overnight_guest",
    title: "Overnight Guests Allowed",
  },
  {
    id: "curfew",
    title: "Curfew Applies",
  },
  {
    id: "cleaning_required",
    title: "Keep Environment Clean",
  },
];