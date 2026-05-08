export const primaryNav = [
  { key: 'home', label: 'Home', link: '/' },
  { key: 'about', label: 'About', slug: 'introduction' },
  { key: 'lens', label: 'Lens', slug: 'lens' },
  { key: 'episodes', label: 'Episodes', link: '/episodes/' },
  { key: 'agent', label: 'How to use?', slug: 'use-with-your-agent' },
];

const starlightPrimaryNav = primaryNav.map(({ key, ...item }) => item);

export const docsSidebar = [
  {
    label: 'Discovery',
    items: [
      { label: 'Who Is Jiang Xueqin?', slug: 'who-is-jiang-xueqin' },
      { label: 'What Is Predictive History?', slug: 'what-is-predictive-history' },
      { label: 'Is Professor Jiang Legit?', slug: 'is-professor-jiang-legit' },
      { label: 'Professor Jiang Predictions', slug: 'professor-jiang-predictions' },
      { label: 'Professor Jiang Transcripts', slug: 'professor-jiang-transcripts' },
    ],
  },
  {
    label: 'Lens Atlas: World-Making',
    items: [
      { label: 'Civilization As Inner Order', slug: 'lens/civilization-as-inner-order' },
      { label: 'How Poetry Creates Civilization', slug: 'lens/how-poetry-creates-civilization' },
      { label: 'How Stories Control Reality', slug: 'lens/how-stories-control-reality' },
      { label: 'The Dead World And The Cave', slug: 'lens/the-dead-world-and-the-cave' },
      { label: 'Fictional Heroes And The Self', slug: 'lens/how-fictional-heroes-become-part-of-the-self' },
      { label: 'The Guide Who Becomes A Trap', slug: 'lens/the-guide-who-becomes-a-trap' },
      { label: 'Human Heart As Civilizational Measure', slug: 'lens/human-heart-as-civilizational-measure' },
      { label: 'Sacred Machines', slug: 'lens/sacred-machines' },
    ],
  },
  {
    label: 'Lens Atlas: Power And Institutions',
    items: [
      { label: 'Attention Capture As Capital Extraction', slug: 'lens/attention-capture-as-capital-extraction' },
      { label: 'Bureaucracy As Institutional Death', slug: 'lens/bureaucracy-as-institutional-death' },
      { label: 'Education As A Soul Game', slug: 'lens/education-as-a-soul-game' },
      { label: 'Free Will As Cosmic Burden', slug: 'lens/free-will-as-cosmic-burden' },
      { label: 'Gerontocracy As Intergenerational Extraction', slug: 'lens/gerontocracy-as-intergenerational-extraction' },
      { label: 'Living School For Psychohistory', slug: 'lens/living-school-for-psychohistory' },
    ],
  },
  {
    label: 'Lens Atlas: State And Strategy',
    items: [
      { label: 'Game Theory', slug: 'lens/game-theory' },
      { label: 'Eschatology As Script', slug: 'lens/eschatology' },
      { label: 'Legitimacy Fiction', slug: 'lens/legitimacy-fiction' },
      { label: 'Nation As God-Machine', slug: 'lens/nation-as-god-machine' },
      { label: 'Power As Alchemy', slug: 'lens/power-as-alchemy' },
      { label: 'Secret Society As Coordination Technology', slug: 'lens/secret-society-as-coordination-technology' },
      { label: 'Taboo As Control Surface', slug: 'lens/taboo-as-control-surface' },
      { label: 'The Borderland Engine', slug: 'lens/the-borderland-engine' },
      { label: 'War As Story Versus Material Test', slug: 'lens/when-war-becomes-a-story-instead-of-a-material-test' },
    ],
  },
];

export const mobileSidebar = [
  {
    label: 'Jiang Lens',
    items: starlightPrimaryNav,
  },
  ...docsSidebar,
];

export const starlightSidebar = mobileSidebar;
