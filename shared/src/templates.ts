export interface TemplateStarterCard {
  title: string;
  description: string;
}

export interface TemplateListDefinition {
  title: string;
  emoji: string;
  starterCard: TemplateStarterCard;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  isDefault: boolean;
  lists: TemplateListDefinition[];
  defaultLabels: Array<{ name: string; color: string }>;
}

export const PROJECT_MANAGEMENT_TEMPLATE: TemplateDefinition = {
  id: 'template-project-management',
  name: 'Project Management',
  tagline: 'Manage Projects To Perfection',
  description:
    "Big dreams turn into bigger results with a killer project plan. Use this basic structure to build your team's ideal workflow, for projects big or small.",
  isDefault: true,
  lists: [
    {
      title: 'Resources (Start Here!)',
      emoji: '📚',
      starterCard: {
        title: 'How to use this list',
        description:
          'This list is perfect for you and your team to have all those documents, specs, designs, or anything you tend to reference all the time. Meeting schedules and answers to common questions are also recommended to pop into this list so that your team is informed at all times. 📚',
      },
    },
    {
      title: 'Questions For Next Meeting',
      emoji: '🌊',
      starterCard: {
        title: 'How to use this list',
        description:
          "Never again forget that important question you thought of in the shower this morning! Slide your Q's into this handy list so your team keeps on flowing. 🌊",
      },
    },
    {
      title: 'To Do',
      emoji: '🔮',
      starterCard: {
        title: 'How to use this list',
        description:
          "The mother of all lists—the good ol' To Do. This is where assigned tasks live so that your team can see who's working on what and when it's due. Crystal clear all day, week, and month. 🔮",
      },
    },
    {
      title: 'Pending',
      emoji: '💬',
      starterCard: {
        title: 'How to use this list',
        description:
          "We all have those in-between tasks that are technically done but also awkwardly waiting for another step. That's where the Pending list comes into play, use this list to share what those next mini-steps are with your team. 💬",
      },
    },
    {
      title: 'Blocked',
      emoji: '🚷',
      starterCard: {
        title: 'How to use this list',
        description:
          'With any successful project comes at least one inevitable blocker. Splash those red-tape, blocking issues that are slowing your team down so you can tackle it in the best way; together. 🚷',
      },
    },
    {
      title: 'Done',
      emoji: '✨',
      starterCard: {
        title: 'How to use this list',
        description:
          'Our favorite list, the Done list. Stop, drag, and drop! For all your finished tasks that your team has hustled on and feels proud of. ✨',
      },
    },
  ],
  defaultLabels: [
    { name: 'Design System', color: '#4BCE97' },
    { name: 'High Priority', color: '#F87168' },
    { name: 'Engineering', color: '#9F8FEF' },
    { name: 'Content', color: '#F5CD47' },
    { name: 'Research', color: '#579DFF' },
  ],
};

export const TEMPLATES: TemplateDefinition[] = [PROJECT_MANAGEMENT_TEMPLATE];
