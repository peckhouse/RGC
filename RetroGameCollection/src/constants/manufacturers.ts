export type ManufacturerKey =
  | 'Nintendo'
  | 'Sony'
  | 'Sega'
  | 'Xbox'
  | 'Atari'
  | 'NEC'
  | 'SNK'
  | 'Bandai';

export interface ManufacturerInfo {
  key: ManufacturerKey;
  name: string;
  logoUrl: string | null;
  color: string;
  history: string;
}

export const MANUFACTURERS: Record<ManufacturerKey, ManufacturerInfo> = {
  Nintendo: {
    key: 'Nintendo',
    name: 'Nintendo',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/200px-Nintendo.svg.png',
    color: '#E60012',
    history:
      'Founded in 1889 in Kyoto, Japan, Nintendo began as a playing card company before revolutionising home gaming with the NES in 1983. Creators of Mario, Zelda, and Pokémon, Nintendo has consistently defined new ways to play through hardware innovations like the Game Boy, Wii, and Switch.',
  },
  Sony: {
    key: 'Sony',
    name: 'Sony',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/200px-Sony_logo.svg.png',
    color: '#003087',
    history:
      "Sony entered gaming in 1994 after a failed partnership with Nintendo on a CD-ROM add-on. The PlayStation brand became the best-selling console family in history — the PS2 alone sold over 155 million units. Sony's focus on cinematic experiences and powerful hardware has made PlayStation a cornerstone of the industry.",
  },
  Sega: {
    key: 'Sega',
    name: 'Sega',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/SEGA_logo.svg/200px-SEGA_logo.svg.png',
    color: '#1A1A8C',
    history:
      'Sega launched its first home console in 1983 and ignited the 1990s console wars with the Mega Drive and its mascot Sonic the Hedgehog. After the commercial disappointment of the Dreamcast in 2001, Sega exited the hardware market and became a third-party publisher — though its legacy titles remain among the most collected today.',
  },
  Xbox: {
    key: 'Xbox',
    name: 'Xbox',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/XBOX_logo_2012.svg/200px-XBOX_logo_2012.svg.png',
    color: '#107C10',
    history:
      "Microsoft entered the console market in 2001 with the original Xbox to challenge Sony's dominance. The Xbox 360 popularised online console gaming through Xbox Live. Today, Microsoft focuses on ecosystem play — Xbox Game Pass, cloud gaming, and cross-platform titles make Xbox one of the most connected platforms in gaming.",
  },
  Atari: {
    key: 'Atari',
    name: 'Atari',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Atari_logo.svg/200px-Atari_logo.svg.png',
    color: '#E87722',
    history:
      'Founded in 1972 by Nolan Bushnell and Ted Dabney, Atari pioneered the home video game market with the Atari 2600. Titles like Space Invaders, Pac-Man, and Pitfall! defined early gaming culture. The iconic "Fuji" logo remains one of the most recognisable symbols in gaming history, and Atari hardware is among the most actively collected today.',
  },
  NEC: {
    key: 'NEC',
    name: 'NEC',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/NEC_logo.svg/200px-NEC_logo.svg.png',
    color: '#003CA6',
    history:
      "NEC's PC Engine (TurboGrafx-16 in North America) launched in 1987 and briefly outsold both the Famicom and Mega Drive in Japan. It was the first console to use a CD-ROM add-on, giving it a library unlike anything else at the time. The platform's rich catalogue of arcade ports and Japanese exclusives makes it a prized collector's system.",
  },
  SNK: {
    key: 'SNK',
    name: 'SNK',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/SNK_logo.svg/200px-SNK_logo.svg.png',
    color: '#0059B3',
    history:
      "SNK's Neo Geo (1990) delivered arcade-perfect gameplay at home — at a premium price that made it a dream machine for dedicated fans. The King of Fighters, Metal Slug, and Samurai Shodown defined an era of 2D excellence. The Neo Geo Pocket Color brought that same quality to the handheld market, and both systems remain highly sought-after by collectors.",
  },
  Bandai: {
    key: 'Bandai',
    name: 'Bandai',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/BANDAI.svg/200px-BANDAI.svg.png',
    color: '#CC0000',
    history:
      "Japanese toy giant Bandai entered the handheld market in 1999 with the WonderSwan, co-designed with Gunpei Yokoi — the creator of the original Game Boy. Sold exclusively in Japan, the WonderSwan and its Color successor offered a distinctive library of RPGs, ports, and exclusives. Compact, affordable, and unique, they're a favourite among Japanese retro collectors.",
  },
};

export const MANUFACTURER_ORDER: ManufacturerKey[] = [
  'Nintendo',
  'Sony',
  'Sega',
  'Xbox',
  'Atari',
  'NEC',
  'SNK',
  'Bandai',
];
