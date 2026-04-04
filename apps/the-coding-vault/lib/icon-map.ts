import {
  faHtml5,
  faReact,
  faNodeJs,
  faGithub,
  faCss3Alt,
  faJs,
  IconDefinition,
  faGit,
  faCodepen,
  faDiscord,
  faInstagram,
  faLinkedin,
  faSquareFacebook,
  faStackOverflow,
  faTiktok,
  faTwitch,
  faXTwitter,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import {
  faDatabase,
  faGlobe,
  faQuestionCircle,
  faServer,
} from '@fortawesome/free-solid-svg-icons';
import { TIconKey, TSocialIcons } from '@/types/types';

export const iconMap: Record<TIconKey, IconDefinition> = {
  git: faGit,
  github: faGithub,
  node: faNodeJs,
  html: faHtml5,
  css: faCss3Alt,
  js: faJs,
  react: faReact,
  backend: faServer,
  database: faDatabase,
  default: faQuestionCircle,
};

export const socialIcons: Record<TSocialIcons, IconDefinition> = {
  website: faGlobe,
  github: faGithub,
  linkedin: faLinkedin,
  codepen: faCodepen,
  stackoverflow: faStackOverflow,
  youtube: faYoutube,
  twitter: faXTwitter,
  twitch: faTwitch,
  discord: faDiscord,
  instagram: faInstagram,
  tiktok: faTiktok,
  facebook: faSquareFacebook,
};
