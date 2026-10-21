export type EventType = 'war' | 'civil_war' | 'slavery' | 'conquest' | 'genocide' | 'colonialism';
export type Region = 'europe' | 'asia' | 'africa' | 'americas' | 'middle_east' | 'global';

export interface HistoricalEvent {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  type: EventType;
  region: Region;
  description: string;
  casualties?: string;
}

export const events: HistoricalEvent[] = [
  { id: 'punic-wars', name: 'Punic Wars (Rome vs Carthage)', startYear: -264, endYear: -146, type: 'war', region: 'europe', description: 'Three major wars between Rome and Carthage for Mediterranean dominance. Carthage was ultimately destroyed.', casualties: '1.5 million+' },
  { id: 'roman-conquests', name: 'Roman Imperial Conquests', startYear: -200, endYear: 117, type: 'conquest', region: 'europe', description: 'Rome systematically conquered most of Europe, North Africa, and the Middle East through centuries of warfare.', casualties: 'Millions' },
  { id: 'roman-slavery', name: 'Roman Slave System', startYear: -200, endYear: 400, type: 'slavery', region: 'europe', description: 'At its peak, ~30-40% of the Roman population were enslaved. Slaves were taken in conquests across Europe, Africa, and Asia.', casualties: 'Tens of millions enslaved' },
  { id: 'han-xiongnu', name: 'Han-Xiongnu Wars', startYear: -200, endYear: 89, type: 'war', region: 'asia', description: 'Centuries of conflict between the Han Dynasty and the Xiongnu nomadic confederation across Central Asia.', casualties: 'Hundreds of thousands' },
  { id: 'greco-persian', name: 'Greco-Persian Wars', startYear: -499, endYear: -449, type: 'war', region: 'middle_east', description: 'Persian Empire attempts to conquer Greece; major battles at Marathon, Thermopylae, and Salamis.', casualties: 'Hundreds of thousands' },
  { id: 'alexander-conquests', name: "Alexander the Great's Conquests", startYear: -336, endYear: -323, type: 'conquest', region: 'middle_east', description: 'Alexander conquered Persia, Egypt, Central Asia, and northwestern India in a decade of continuous warfare.', casualties: 'Hundreds of thousands' },
  { id: 'qin-unification', name: 'Warring States & Qin Unification', startYear: -475, endYear: -221, type: 'civil_war', region: 'asia', description: 'Centuries of warfare between Chinese states culminating in Qin Shi Huang unifying China through conquest.', casualties: 'Millions' },
  { id: 'roman-jewish-wars', name: 'Roman-Jewish Wars', startYear: 66, endYear: 135, type: 'war', region: 'middle_east', description: 'Three major Jewish revolts against Roman rule. The destruction of Jerusalem and the diaspora resulted.', casualties: '1 million+' },
  { id: 'arab-slave-trade', name: 'Arab/Trans-Saharan Slave Trade', startYear: 650, endYear: 1900, type: 'slavery', region: 'africa', description: 'The Arab slave trade spanned over 1,200 years, involving the forced migration of millions of Africans to the Middle East and Asia.', casualties: '10-18 million enslaved' },
  { id: 'islamic-conquests', name: 'Early Islamic Conquests', startYear: 632, endYear: 750, type: 'conquest', region: 'middle_east', description: "Within a century of Muhammad's death, Muslim armies conquered the Arabian Peninsula, Persia, Egypt, North Africa, and Spain.", casualties: 'Millions' },
  { id: 'viking-raids', name: 'Viking Raids & Expansion', startYear: 793, endYear: 1100, type: 'conquest', region: 'europe', description: 'Norse raiders and settlers conquered and plundered across Europe from Britain and Ireland to the Mediterranean and Eastern Europe.', casualties: 'Hundreds of thousands' },
  { id: 'carolingian-wars', name: "Charlemagne's Conquests", startYear: 768, endYear: 814, type: 'conquest', region: 'europe', description: 'Charlemagne forcibly united much of Western Europe, conducting dozens of military campaigns including the forced conversion of the Saxons.', casualties: 'Hundreds of thousands' },
  { id: 'crusades', name: 'The Crusades', startYear: 1096, endYear: 1291, type: 'war', region: 'middle_east', description: 'Eight major Catholic military campaigns to seize the Holy Land from Muslim control, involving mass slaughter of Muslims, Jews, and Eastern Christians.', casualties: '1-3 million' },
  { id: 'mongol-conquests', name: 'Mongol Conquests', startYear: 1206, endYear: 1368, type: 'conquest', region: 'asia', description: 'The largest contiguous land empire in history. Mongol armies destroyed entire civilizations across Asia, Russia, the Middle East, and Eastern Europe.', casualties: '40 million+ (up to 10% of world population)' },
  { id: 'mongol-china', name: 'Mongol Conquest of China', startYear: 1211, endYear: 1279, type: 'conquest', region: 'asia', description: "Genghis Khan and his successors destroyed the Jin and Song dynasties. China's population may have dropped by 30-40%.", casualties: '30-40 million' },
  { id: 'mongol-middle-east', name: 'Mongol Destruction of the Abbasid Caliphate', startYear: 1258, endYear: 1260, type: 'conquest', region: 'middle_east', description: 'Hulagu Khan sacked Baghdad in 1258, killing the caliph and destroying the cultural heart of the Islamic world.', casualties: '200,000-800,000' },
  { id: 'black-death-conflicts', name: 'Black Death & Aftermath Conflicts', startYear: 1347, endYear: 1400, type: 'civil_war', region: 'europe', description: 'The Black Death (killing 30-60% of Europeans) triggered widespread peasant revolts, pogroms against Jews, and social upheaval across the continent.', casualties: '25-50 million from plague' },
  { id: 'hundred-years-war', name: "Hundred Years' War", startYear: 1337, endYear: 1453, type: 'war', region: 'europe', description: 'A series of conflicts between England and France over the French throne, devastating the French countryside for over a century.', casualties: '2-3 million' },
  { id: 'ottoman-conquests', name: 'Ottoman Empire Expansion', startYear: 1299, endYear: 1683, type: 'conquest', region: 'middle_east', description: 'The Ottoman Empire expanded through conquest across Anatolia, the Balkans, the Middle East, and North Africa over nearly four centuries.', casualties: 'Millions' },
  { id: 'spanish-americas', name: 'Spanish Conquest of the Americas', startYear: 1492, endYear: 1600, type: 'conquest', region: 'americas', description: 'Spain conquered the Aztec, Inca, and Maya empires. Warfare, enslavement, and especially European disease destroyed up to 90% of the indigenous population.', casualties: '50-70 million (disease + warfare)' },
  { id: 'transatlantic-slave-trade', name: 'Transatlantic Slave Trade', startYear: 1501, endYear: 1867, type: 'slavery', region: 'americas', description: 'European powers forcibly transported ~12.5 million Africans to the Americas. Millions more died during capture in Africa or the Middle Passage.', casualties: '12.5 million+ enslaved; millions died in transit' },
  { id: 'american-slavery', name: 'American Chattel Slavery', startYear: 1619, endYear: 1865, type: 'slavery', region: 'americas', description: 'Slavery in the British colonies and later the United States — one of the most brutal and dehumanizing systems of chattel slavery in history.', casualties: '~4 million enslaved at peak' },
  { id: 'thirty-years-war', name: "Thirty Years' War", startYear: 1618, endYear: 1648, type: 'war', region: 'europe', description: 'A devastating religious and political conflict across the Holy Roman Empire. Some German regions lost 25-40% of their population.', casualties: '8 million' },
  { id: 'mughal-conquests', name: 'Mughal Empire Conquests', startYear: 1526, endYear: 1707, type: 'conquest', region: 'asia', description: 'The Mughal Empire conquered and unified most of the Indian subcontinent through centuries of warfare and consolidation.', casualties: 'Millions' },
  { id: 'japanese-civil-wars', name: 'Japanese Sengoku Period', startYear: 1467, endYear: 1615, type: 'civil_war', region: 'asia', description: 'Nearly 150 years of constant civil war between feudal lords (daimyo) for control of Japan before Tokugawa unification.', casualties: 'Millions' },
  { id: 'british-india', name: 'British Colonization of India', startYear: 1757, endYear: 1947, type: 'colonialism', region: 'asia', description: "Britain's East India Company and later the Crown ruled India for 190 years, extracting wealth and causing recurring famines that killed tens of millions.", casualties: '30-35 million (famines)' },
  { id: 'belgian-congo', name: 'Belgian Congo Atrocities', startYear: 1885, endYear: 1908, type: 'colonialism', region: 'africa', description: "King Leopold II's private colony in the Congo used systematic terror, mutilation, and forced labor to extract rubber. The population may have been halved.", casualties: '10 million+' },
  { id: 'scramble-africa', name: 'European Scramble for Africa', startYear: 1881, endYear: 1914, type: 'colonialism', region: 'africa', description: 'European powers carved up Africa at the 1884 Berlin Conference with no African representation, triggering wars and the destruction of countless societies.', casualties: 'Millions' },
  { id: 'french-colonialism', name: 'French Colonial Empire', startYear: 1830, endYear: 1962, type: 'colonialism', region: 'africa', description: 'France built the second-largest colonial empire, spanning Africa, Southeast Asia, and the Americas, maintained through military force and suppressed uprisings.', casualties: 'Millions across colonies' },
  { id: 'native-american-genocide', name: 'Dispossession of Native Americans', startYear: 1607, endYear: 1890, type: 'genocide', region: 'americas', description: 'Centuries of wars, forced removals (Trail of Tears), broken treaties, and deliberate policies reduced the Native American population from millions to hundreds of thousands.', casualties: '~2-10 million' },
  { id: 'taiping-rebellion', name: 'Taiping Rebellion', startYear: 1850, endYear: 1864, type: 'civil_war', region: 'asia', description: 'One of the deadliest civil wars in history: a Christian-inspired uprising against the Qing dynasty devastated southern China.', casualties: '20-30 million' },
  { id: 'napoleonic-wars', name: 'Napoleonic Wars', startYear: 1803, endYear: 1815, type: 'war', region: 'europe', description: "Napoleon's French Empire conquered most of continental Europe, triggering a coalition of nations that ultimately defeated France after 12 years of warfare.", casualties: '3.5-6 million' },
  { id: 'american-civil-war', name: 'American Civil War', startYear: 1861, endYear: 1865, type: 'civil_war', region: 'americas', description: 'The bloodiest war in American history, fought over slavery and union. More Americans died in this conflict than in any other war the US has fought.', casualties: '620,000-750,000' },
  { id: 'crimean-war', name: 'Crimean War', startYear: 1853, endYear: 1856, type: 'war', region: 'europe', description: 'Russia vs. an alliance of the Ottoman Empire, France, Britain, and Sardinia over influence in the declining Ottoman Empire.', casualties: '500,000-600,000' },
  { id: 'opium-wars', name: 'Opium Wars', startYear: 1839, endYear: 1860, type: 'war', region: 'asia', description: "Britain forced China to open up to opium trade through two military campaigns, marking the beginning of China's century of humiliation.", casualties: 'Tens of thousands' },
  { id: 'indian-slavery', name: 'Indian Indenture System', startYear: 1838, endYear: 1917, type: 'slavery', region: 'asia', description: 'After abolishing slavery, Britain created an indenture system binding ~1.5 million Indians to near-slave conditions on plantations in the Caribbean, Africa, and Pacific.', casualties: '1.5 million indentured' },
  { id: 'zulu-wars', name: 'Anglo-Zulu War & African Resistance', startYear: 1879, endYear: 1902, type: 'war', region: 'africa', description: "Britain's military conquest of the Zulu Kingdom and Boer Republics in southern Africa. The Boer War introduced concentration camps.", casualties: '100,000+' },
  { id: 'ww1', name: 'World War I', startYear: 1914, endYear: 1918, type: 'war', region: 'global', description: 'The war to end all wars — industrial-scale slaughter in the trenches of Europe, combined with colonial fronts across Africa and the Middle East.', casualties: '20 million dead; 21 million wounded' },
  { id: 'armenian-genocide', name: 'Armenian Genocide', startYear: 1915, endYear: 1923, type: 'genocide', region: 'middle_east', description: 'The Ottoman Empire systematically exterminated 1-1.5 million Armenians through mass executions and death marches.', casualties: '1-1.5 million' },
  { id: 'russian-civil-war', name: 'Russian Revolution & Civil War', startYear: 1917, endYear: 1922, type: 'civil_war', region: 'europe', description: 'The Bolshevik revolution and subsequent civil war killed millions through combat, famine, and terror across the former Russian Empire.', casualties: '7-12 million' },
  { id: 'chinese-civil-war', name: 'Chinese Civil War', startYear: 1927, endYear: 1949, type: 'civil_war', region: 'asia', description: 'Decades of conflict between Nationalist and Communist forces, interrupted by the Japanese invasion, ultimately resulting in the founding of the PRC.', casualties: '8 million+' },
  { id: 'ww2', name: 'World War II', startYear: 1939, endYear: 1945, type: 'war', region: 'global', description: 'The deadliest conflict in human history, involving nearly every nation. Included the Holocaust, Soviet gulags, Japanese war crimes, and atomic bombings.', casualties: '70-85 million' },
  { id: 'holocaust', name: 'The Holocaust', startYear: 1941, endYear: 1945, type: 'genocide', region: 'europe', description: 'Nazi Germany systematically murdered ~6 million Jews and ~5-6 million others (Roma, disabled, political prisoners) in a state-organized genocide.', casualties: '11 million+' },
  { id: 'soviet-gulags', name: 'Soviet Gulag System', startYear: 1918, endYear: 1953, type: 'slavery', region: 'europe', description: 'The Soviet Union ran a vast network of forced labor camps holding ~18 million people over its history. Millions died from harsh conditions.', casualties: '1.5-1.8 million died in camps' },
  { id: 'holodomor', name: 'Soviet Engineered Famines (Holodomor)', startYear: 1932, endYear: 1933, type: 'genocide', region: 'europe', description: "Stalin's forced collectivization caused a deliberate famine in Ukraine and other regions, killing millions in a single year.", casualties: '3.5-7.5 million' },
  { id: 'japanese-china', name: 'Japanese Invasion of China', startYear: 1937, endYear: 1945, type: 'war', region: 'asia', description: "Japan's brutal occupation of China included the Nanjing Massacre and biological/chemical warfare. Among the most horrific atrocities of the 20th century.", casualties: '8-20 million Chinese' },
  { id: 'partition-india', name: 'Partition of India', startYear: 1947, endYear: 1948, type: 'civil_war', region: 'asia', description: "Britain's hasty division of India into India and Pakistan triggered massive communal violence and one of the largest forced migrations in history.", casualties: '200,000-2 million; 14 million displaced' },
  { id: 'korean-war', name: 'Korean War', startYear: 1950, endYear: 1953, type: 'war', region: 'asia', description: 'North Korean invasion of South Korea, followed by UN (primarily US) intervention and Chinese entry. Ended in an armistice, not a peace treaty.', casualties: '2.5-3.5 million' },
  { id: 'vietnam-war', name: 'Vietnam War', startYear: 1955, endYear: 1975, type: 'war', region: 'asia', description: 'US intervention in the Vietnamese civil war. Extensive bombing campaigns, chemical weapons (Agent Orange), and civilian casualties defined the conflict.', casualties: '2-3.5 million' },
  { id: 'cambodian-genocide', name: 'Cambodian Genocide (Khmer Rouge)', startYear: 1975, endYear: 1979, type: 'genocide', region: 'asia', description: "Pol Pot's Khmer Rouge killed 1.5-2 million people (25% of Cambodia's population) in forced labor camps and mass executions.", casualties: '1.5-2 million (25% of population)' },
  { id: 'mao-famine', name: "Mao's Great Leap Forward Famine", startYear: 1959, endYear: 1961, type: 'genocide', region: 'asia', description: "Mao's forced collectivization caused the deadliest famine in history. Grain was exported while millions of Chinese starved.", casualties: '15-55 million' },
  { id: 'algerian-war', name: 'Algerian War of Independence', startYear: 1954, endYear: 1962, type: 'war', region: 'africa', description: "Algeria's brutal war of independence from France. France used systematic torture, collective punishment, and killed hundreds of thousands.", casualties: '400,000-1.5 million' },
  { id: 'rwandan-genocide', name: 'Rwandan Genocide', startYear: 1994, endYear: 1994, type: 'genocide', region: 'africa', description: 'In 100 days, Hutu extremists massacred ~800,000 Tutsi and moderate Hutu. The international community largely stood by.', casualties: '500,000-800,000' },
  { id: 'congo-wars', name: 'Congo Wars', startYear: 1996, endYear: 2003, type: 'war', region: 'africa', description: 'Two devastating wars in the Democratic Republic of Congo, involving nine nations, caused the deadliest conflict since World War II.', casualties: '5.4 million' },
  { id: 'yugoslav-wars', name: 'Yugoslav Wars / Bosnian Genocide', startYear: 1991, endYear: 2001, type: 'civil_war', region: 'europe', description: 'The breakup of Yugoslavia led to ethnic cleansing and genocide in Europe for the first time since World War II. Srebrenica massacre killed 8,000+ Bosniak men.', casualties: '140,000+' },
  { id: 'iraqi-kurdish-genocide', name: 'Iraqi Kurdish Genocide (Anfal)', startYear: 1986, endYear: 1989, type: 'genocide', region: 'middle_east', description: "Saddam Hussein's Anfal campaign used chemical weapons and mass executions against Kurdish civilians in northern Iraq.", casualties: '50,000-182,000' },
  { id: 'iran-iraq-war', name: 'Iran-Iraq War', startYear: 1980, endYear: 1988, type: 'war', region: 'middle_east', description: 'Eight years of brutal trench warfare, including chemical weapons use. Backed by various superpowers, it changed little but devastated both nations.', casualties: '500,000-1 million' },
  { id: 'afghanistan-war', name: 'Afghan Wars (Soviet & US)', startYear: 1979, endYear: 2021, type: 'war', region: 'middle_east', description: 'Over four decades of near-continuous warfare in Afghanistan — Soviet occupation (1979-89), civil war (1989-96), Taliban rule, and the US-led war (2001-21).', casualties: '2-4 million' },
  { id: 'apartheid', name: 'South African Apartheid', startYear: 1948, endYear: 1994, type: 'colonialism', region: 'africa', description: "South Africa's legally enforced system of racial segregation stripped Black South Africans of rights, land, and dignity for nearly 50 years.", casualties: '~30,000 killed in political violence' },
  { id: 'north-korean-camps', name: 'North Korean Political Prison Camps', startYear: 1948, endYear: 2024, type: 'slavery', region: 'asia', description: 'North Korea has maintained political prison camps since its founding, holding up to 200,000 people in forced labor under brutal conditions.', casualties: 'Hundreds of thousands' },
  { id: 'syrian-civil-war', name: 'Syrian Civil War', startYear: 2011, endYear: 2023, type: 'civil_war', region: 'middle_east', description: "Syria's civil war involved dozens of factions, chemical weapons attacks, and the rise of ISIS. Created the largest refugee crisis since World War II.", casualties: '300,000-500,000' },
  { id: 'yemeni-civil-war', name: 'Yemeni Civil War', startYear: 2014, endYear: 2024, type: 'civil_war', region: 'middle_east', description: 'A devastating civil war fueled by Saudi-Iranian proxy conflict has caused one of the world\'s worst humanitarian catastrophes.', casualties: '150,000+ direct; 377,000 total including famine' },
  { id: 'uyghur-camps', name: 'Uyghur Detention in China', startYear: 2017, endYear: 2024, type: 'genocide', region: 'asia', description: 'China has detained over 1 million Uyghurs in re-education camps with documented forced labor, forced sterilizations, and cultural destruction.', casualties: '1 million+ detained' },
];

export const typeColors: Record<EventType, string> = {
  war: '#ef4444',
  civil_war: '#f97316',
  slavery: '#a855f7',
  conquest: '#eab308',
  genocide: '#dc2626',
  colonialism: '#3b82f6',
};

export const typeLabels: Record<EventType, string> = {
  war: 'War / International Conflict',
  civil_war: 'Civil War / Internal Conflict',
  slavery: 'Slavery / Forced Labor',
  conquest: 'Conquest / Land Seizure',
  genocide: 'Genocide / Mass Atrocity',
  colonialism: 'Colonialism / Occupation',
};

export const regionLabels: Record<Region, string> = {
  europe: 'Europe',
  asia: 'Asia & Pacific',
  africa: 'Africa',
  americas: 'The Americas',
  middle_east: 'Middle East',
  global: 'Global',
};
