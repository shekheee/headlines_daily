/**
 * Seed script: creates admin user + categories + 20 articles from today's top news
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "World",       slug: "world",       color: "#dc2626", description: "Global news and international affairs" },
  { name: "Politics",    slug: "politics",    color: "#2563eb", description: "US and world politics" },
  { name: "Technology",  slug: "technology",  color: "#7c3aed", description: "Tech, science and innovation" },
  { name: "Sports",      slug: "sports",      color: "#16a34a", description: "Sports news and results" },
  { name: "Culture",     slug: "culture",     color: "#d97706", description: "Arts, entertainment and culture" },
  { name: "UK",          slug: "uk",          color: "#0891b2", description: "UK and British news" },
  { name: "Science",     slug: "science",     color: "#059669", description: "Science and space exploration" },
];

// ─── Articles (today's real news, rewritten as original content) ────────────────
const ARTICLES = [
  // WORLD
  {
    category: "world",
    title: "US Airman Rescued from Iran After Two Days Behind Enemy Lines",
    excerpt: "American forces successfully extracted a US Air Force airman who had been stranded in hostile territory for over 48 hours following the downing of his F-15E Strike Eagle by Iranian forces.",
    content: `<h2>A Daring Rescue Deep Inside Iran</h2>
<p>US special operations forces carried out a daring nighttime rescue operation to extract a downed American airman from deep inside Iranian territory on Saturday, President Trump confirmed. The F-15E Strike Eagle crew member had been stranded for more than two days after his aircraft was shot down by Iranian air defenses earlier in the week.</p>
<p>The rescue mission involved multiple branches of the US military coordinating in hostile airspace, according to senior officials who spoke on condition of anonymity. The airman, whose identity has not been publicly released, was reported to be in good condition after the extraction.</p>
<h2>Conflicting Claims of Victory</h2>
<p>Both Washington and Tehran claimed success from the incident. US officials pointed to the successful rescue as a demonstration of American military capability, while Iranian state media described the shooting down of the advanced fighter as a significant achievement for its air defense systems.</p>
<p>Defense analysts warned that the conflicting narratives could fuel further escalation in an already tense regional standoff. "When both sides declare victory from the same incident, you have a recipe for the next confrontation," one former Pentagon official told reporters.</p>
<h2>Diplomatic Fallout</h2>
<p>The incident has sharply raised tensions between Washington and Tehran, with the State Department summoning the Iranian chargé d'affaires to deliver a formal protest. Congressional leaders from both parties called for a full briefing on the circumstances surrounding the shootdown and the rescue operation.</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-05T10:00:00Z"),
  },
  {
    category: "world",
    title: "Pope Leo XIV Delivers First Easter Message, Calls for Global Peace",
    excerpt: "In his first Easter Sunday address as pontiff, Pope Leo XIV urged world leaders to choose dialogue over war, condemning violence in conflict zones across the globe.",
    content: `<h2>A New Voice from St Peter's Square</h2>
<p>Pope Leo XIV addressed tens of thousands of worshippers gathered in St Peter's Square on Easter Sunday, delivering his first major public address since ascending to the papacy. The new pontiff used the occasion to issue a powerful call for peace, urging global leaders to reject war and embrace dialogue.</p>
<p>Speaking in multiple languages from the central loggia of St Peter's Basilica, the Pope specifically rejected what he described as "those who wage war in God's name," drawing sustained applause from the crowd below.</p>
<h2>Condemnation of Ongoing Conflicts</h2>
<p>Without naming specific countries, Pope Leo alluded to several ongoing conflicts, calling for immediate ceasefires and the protection of civilian populations. He referenced the suffering of children caught in war zones and called for greater international cooperation on humanitarian aid.</p>
<p>"Easter is a message of hope," he told the assembled faithful. "But hope is not passive — it demands action from every leader, every nation, every person of conscience."</p>
<h2>A New Papal Direction</h2>
<p>Vatican observers noted that the address signaled a continuation of the Church's strong stance on peace and social justice, while introducing the new Pope's distinctive voice and rhetorical style. Diplomatic representatives from over 100 countries were present for the historic address.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T12:00:00Z"),
  },
  {
    category: "world",
    title: "Haiti Massacre: Dozens Killed as UN-Backed Force Begins Deployment",
    excerpt: "A brutal gang massacre in Haiti has claimed dozens of lives just as an international suppression force begins trickling into the country, highlighting the enormous security challenge ahead.",
    content: `<h2>Violence Erupts Across Haiti</h2>
<p>Armed gangs carried out a massacre in a rural Haitian community over the weekend, killing dozens of civilians in an attack that human rights organizations described as one of the deadliest single incidents in recent memory. The killings underscore the profound security crisis gripping the Caribbean nation.</p>
<p>The attack took place in a region that has seen escalating gang activity over recent months, as criminal organizations have expanded their territorial control across much of the country. Local officials said survivors fled into the surrounding countryside.</p>
<h2>UN Force Begins Arrival</h2>
<p>The massacre coincides with the initial deployment of a United Nations-backed Gang Suppression Force, a multinational security mission that has been years in the making. The first contingents began arriving in Port-au-Prince this week, though officials acknowledged the force remains far below its intended operational strength.</p>
<p>"What we're seeing on the ground illustrates both why this mission is needed and the scale of what it faces," said a UN spokesperson. The force is expected to eventually comprise several thousand officers from contributing nations.</p>
<h2>A Long Road Ahead</h2>
<p>Analysts cautioned that even a fully deployed international force will face a complex and entrenched gang ecosystem that has filled the power vacuum left by years of political instability. Haiti's national police remain severely under-resourced and demoralized.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T09:00:00Z"),
  },
  {
    category: "world",
    title: "Germany Moves to Restrict Military-Age Men From Extended Foreign Travel",
    excerpt: "A new German law could require men under 45 to obtain military approval before taking extended stays abroad, as Berlin prepares for a new era of national defense obligations.",
    content: `<h2>New Defense Obligations Take Shape</h2>
<p>Germany has introduced legislation that could require men under the age of 45 to seek military authorization before spending extended periods living abroad, as the country accelerates its rearmament and readiness agenda. The law, which has attracted significant public debate, represents one of the most significant expansions of military-related civil obligations since the Cold War era.</p>
<p>The measure is part of a broader package of national defense reforms that the German government has been advancing in response to heightened security threats on the European continent.</p>
<h2>Details and Enforcement Uncertainty</h2>
<p>Under the legislation, approvals for extended foreign stays must generally be granted unless specific military readiness concerns are cited. However, legal experts and government officials themselves have acknowledged uncertainty about how the rule would be enforced if violated by German citizens living overseas.</p>
<p>Critics of the measure have raised civil liberties concerns, arguing that it represents an unacceptable infringement on freedom of movement for ordinary citizens. Supporters counter that a credible national defense requires some obligations from the civilian population.</p>
<h2>Europe's Shifting Security Landscape</h2>
<p>Germany's moves form part of a broader European trend toward increased defense spending and preparedness. Several NATO allies have been reviewing or reinstating forms of mandatory military service as the security environment on the continent has deteriorated.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T08:30:00Z"),
  },
  // SCIENCE/SPACE
  {
    category: "science",
    title: "Artemis II Astronauts Witness Historic First Glimpse of Moon's Far Side",
    excerpt: "The crew of NASA's Artemis II mission described the view as 'absolutely spectacular' as they became the first humans in over 50 years to see the far side of the Moon up close.",
    content: `<h2>A Historic View from Artemis II</h2>
<p>The four-person crew of NASA's Artemis II mission captured humanity's closest view of the Moon's far side in over five decades on Sunday, as their Orion spacecraft completed its outbound transit around the lunar body. Commander Reid Wiseman described the view as "absolutely spectacular," with the cratered, ancient terrain filling the spacecraft's windows.</p>
<p>The mission marks a significant milestone in NASA's Artemis program, which aims to return astronauts to the lunar surface for the first time since Apollo 17 in 1972.</p>
<h2>What the Crew Is Seeing</h2>
<p>Unlike the near side of the Moon, which faces Earth and is familiar to anyone who has looked up at the night sky, the far side is permanently hidden from view from our planet's surface. It is more heavily cratered and lacks the large dark volcanic plains — known as maria — that define the near side's distinctive appearance.</p>
<p>"It's a completely different world from what we grew up looking at," mission specialist Christina Koch said in a communication relayed to mission control. "Every crater tells a story about the early solar system."</p>
<h2>Looking Ahead to Artemis III</h2>
<p>The Artemis II mission is a crewed flyby without a lunar landing, designed to validate the Orion spacecraft and Space Launch System in a deep space environment with astronauts aboard. Its success is critical for Artemis III, which is planned to land the first woman and first person of color on the Moon's south pole.</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-05T06:00:00Z"),
  },
  // TECHNOLOGY
  {
    category: "technology",
    title: "Apple Turns 50: The Products That Defined a Company — and Those That Flopped",
    excerpt: "As Apple celebrates its 50th anniversary, analysts look back at the innovations that transformed how billions of people live and work, alongside some notable misfires.",
    content: `<h2>Half a Century of Apple</h2>
<p>Apple Computer was founded on April 1, 1976, by Steve Jobs, Steve Wozniak, and Ronald Wayne in a garage in Los Altos, California. Fifty years later, the company is among the most valuable in human history, with a product lineup that has fundamentally reshaped communication, entertainment, personal computing, and health technology.</p>
<h2>Three Products That Changed Everything</h2>
<p><strong>The Macintosh (1984):</strong> The Mac introduced the graphical user interface and mouse to the mass market, democratizing personal computing and making it accessible to people who had never written a line of code. The famous "1984" Super Bowl advertisement, directed by Ridley Scott, announced it to the world in style.</p>
<p><strong>The iPod and iTunes (2001):</strong> Together, these products didn't just change how people listened to music — they obliterated the existing music industry business model and replaced it with something new. The iPod's "1,000 songs in your pocket" tagline captured a genuine revolution in how we relate to music.</p>
<p><strong>The iPhone (2007):</strong> Arguably the most consequential consumer product of the 21st century, the iPhone created the smartphone era and with it the app economy, social media ubiquity, and the always-connected world we now inhabit.</p>
<h2>Three That Really Didn't Work</h2>
<p><strong>Apple Lisa (1983):</strong> The precursor to the Mac was priced at $9,995 and found almost no commercial market. It was quietly discontinued within two years.</p>
<p><strong>Apple Newton (1993):</strong> The original personal digital assistant was ahead of its time in concept but failed badly in execution — its handwriting recognition was so poor it became a cultural joke.</p>
<p><strong>Apple Maps at launch (2012):</strong> Replacing Google Maps on iPhones with an unfinished product was widely considered one of Apple's biggest public embarrassments under Tim Cook, prompting a rare public apology.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T23:56:00Z"),
  },
  {
    category: "technology",
    title: "China Tightens Drone Flight Rules, Frustrating Civilian Users",
    excerpt: "New Chinese regulations governing civilian drone use are restricting far more airspace than pilots expected, with hobbyists and commercial operators reporting widespread disruption.",
    content: `<h2>New Rules Ground Thousands of Drone Operators</h2>
<p>China's latest round of civilian drone flight regulations, intended to address safety concerns and curb unauthorized use near sensitive areas, has been met with frustration by recreational and commercial operators who say the restrictions are far broader than necessary.</p>
<p>The rules, which took effect this year, impose strict no-fly zones around a wide range of locations and require registration and licensing for a broader category of aircraft than before. Operators say that in practice, large portions of urban areas and popular scenic locations have effectively become off-limits.</p>
<h2>DJI's Global Reach Affected</h2>
<p>The regulations have implications beyond China's borders, as DJI — the world's dominant consumer drone manufacturer — must build compliance systems into products sold globally. Some users report that firmware updates reflecting the Chinese regulatory framework have also affected the behavior of their devices in other countries.</p>
<p>"I understand the need for safety rules," said one Beijing-based drone photographer. "But some of these restrictions make no sense. You could apply for permission for a year and still not get it."</p>
<h2>Balancing Innovation and Control</h2>
<p>Analysts noted the tension between China's ambition to lead the global drone industry — where it already dominates — and a regulatory instinct that prioritizes control and security. Several domestic drone manufacturers have lobbied quietly for a relaxation of the most restrictive provisions.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T04:01:00Z"),
  },
  // SPORTS
  {
    category: "sports",
    title: "Wilder Defeats Chisora by Split Decision, Immediately Calls Out Joshua",
    excerpt: "Deontay Wilder returned to winning ways with a dramatic split decision victory over Derek Chisora, before calling out Anthony Joshua in a post-fight interview that set social media ablaze.",
    content: `<h2>The Bronze Bomber is Back</h2>
<p>Deontay Wilder delivered a statement performance at the O2 Arena on Saturday night, grinding out a split decision victory over veteran British heavyweight Derek Chisora in a contest that showcased both fighters' durability and will. The American former WBC champion, who had suffered consecutive defeats to Tyson Fury before rebuilding his record, was given scores of 115-113, 114-114, and 115-113 by the three ringside judges.</p>
<p>The fight, which lived up to its "grudge match" billing, saw both men hurt and rocked during a dramatic middle section before Wilder asserted his authority in the championship rounds.</p>
<h2>The Call-Out Heard Around Boxing</h2>
<p>Before the sweat had dried under the ring lights, Wilder grabbed the microphone and issued a direct challenge to Anthony Joshua, whose own career renaissance has generated enormous excitement among British fans. "AJ, I see you watching this. Let's do it. I'm here. You know where to find me," Wilder said to a roaring crowd.</p>
<p>Joshua's promoter Eddie Hearn was ringside and appeared to acknowledge the challenge with a nod. Both camps have previously expressed interest in a fight, but scheduling, financial terms, and the increasingly complex world title picture have made it difficult to bring together.</p>
<h2>Chisora Goes Out on His Shield</h2>
<p>Despite the defeat, Derek Chisora earned considerable praise for his performance. At 42 and widely expected to be outclassed, the Zimbabwean-born Londoner pushed Wilder harder than almost anyone anticipated and showed the heart that has defined a long and often remarkable career.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T11:00:00Z"),
  },
  {
    category: "sports",
    title: "Man City Demolish Chelsea 4-0 to Reach FA Cup Semi-Finals",
    excerpt: "A ruthless Manchester City side ended Chelsea's FA Cup run at the quarter-final stage with a comprehensive 4-0 victory, as the Blues' manager admitted his team 'gave up' in the second half.",
    content: `<h2>City in Cruise Control</h2>
<p>Manchester City produced one of their most dominant cup performances of the season to dismantle Chelsea 4-0 at the Etihad Stadium in the FA Cup quarter-finals, booking their place in the last four with an efficiency that underlined why they remain English football's pre-eminent force.</p>
<p>Goals in each half illustrated City's complete dominance, with Chelsea offering almost no meaningful attacking threat after falling behind in the opening exchanges. The visitors' high defensive line was exposed repeatedly by City's movement and passing.</p>
<h2>Manager Brutally Honest</h2>
<p>In a refreshingly candid post-match press conference, Chelsea's manager admitted that his players had effectively surrendered long before the final whistle. "I'm not going to hide behind tactics today. We gave up. That's not acceptable for a Chelsea team at any level," he said, adding that he expected a full response from his squad in the Premier League run-in.</p>
<p>The defeat raises serious questions about Chelsea's mentality and squad depth ahead of the final weeks of the season, with the club still fighting for a European place.</p>
<h2>City's Semi-Final Opponents</h2>
<p>Manchester City will await the results of the remaining quarter-finals to learn their semi-final opponents. Pep Guardiola's side have historically thrived in the latter stages of cup competitions, and will be strong favourites to reach another final at Wembley.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T12:34:00Z"),
  },
  {
    category: "sports",
    title: "West Ham Hold Off Leeds to Reach FA Cup Semi-Finals in Relegation Battle Subplot",
    excerpt: "In a tie that had enormous implications both for the FA Cup and for Premier League survival, West Ham edged out Leeds United in a tense quarter-final.",
    content: `<h2>Winner Takes All — On Multiple Fronts</h2>
<p>Sunday's FA Cup quarter-final between West Ham United and Leeds United carried unusual weight even by the high-stakes standards of the competition. Both clubs arrive at the tie locked in Premier League relegation battles, creating a dilemma for their managers: prioritize the cup and risk depleting resources needed for the top-flight survival fight, or treat it as a secondary concern?</p>
<p>In the end, both managers named strong sides in what proved to be a gripping and emotionally charged encounter at the London Stadium.</p>
<h2>The Match</h2>
<p>West Ham demonstrated the home advantage with a controlled first-half performance, and their superior physicality proved decisive as the match wore on. Leeds, short of confidence following a difficult run in the league, showed plenty of effort but lacked the cutting edge needed to exploit their moments of opportunity.</p>
<p>The Hammers' victory sends them to the FA Cup semi-finals for the first time in several years, providing a welcome boost to a club and a fanbase that has endured a difficult season.</p>
<h2>Relegation Fight Continues</h2>
<p>For Leeds, the attention now returns entirely to league survival. The club's manager insisted that focus would be unbroken going into the final months of the season. "Cup football is over for us now. Every ounce of energy goes into staying up," he said.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T15:00:00Z"),
  },
  // UK
  {
    category: "uk",
    title: "Storm Dave Causes Travel Chaos Across UK on Easter Weekend",
    excerpt: "Thousands of travellers face disruption to road and rail journeys as Storm Dave sweeps across Britain, though forecasters say conditions are expected to ease through Easter Sunday.",
    content: `<h2>Bank Holiday Disruption</h2>
<p>Storm Dave brought significant disruption to transport across the United Kingdom over the Easter weekend, with major roads closed, rail services suspended, and dozens of flights cancelled as gusts reached 70mph in exposed coastal areas of Scotland and northern England.</p>
<p>The Met Office issued amber weather warnings for wind across Scotland and the north of England, with yellow warnings in place across much of the rest of Britain. Emergency services across several counties reported a surge in weather-related incidents.</p>
<h2>Rail and Road Impact</h2>
<p>Network Rail suspended services on several key routes due to fallen trees and debris on the tracks, leaving thousands of passengers who had planned Easter journeys stranded or forced to find alternative arrangements. Major motorways in the north of England saw multiple closures as high-sided vehicles were blown over by strong crosswinds.</p>
<p>The AA reported it was dealing with a significantly elevated number of breakdowns and weather-related incidents compared to a typical Easter weekend, urging drivers to check conditions before setting out.</p>
<h2>Easing Conditions</h2>
<p>The good news for Easter Sunday is that the storm is tracking northeast, with forecasters at the Met Office predicting it will clear most of the country by mid-morning, bringing a return to sunshine and lighter showers for the afternoon. "It should be a decent afternoon for most people," a spokesperson said. "The worst is over."</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T11:29:00Z"),
  },
  {
    category: "uk",
    title: "PM Starmer 'Concerned' as Pepsi Pulls Out of Kanye West UK Festivals",
    excerpt: "Prime Minister Keir Starmer expressed concern over scheduled UK festival appearances by Kanye West after Pepsi announced it was withdrawing its sponsorship from the events.",
    content: `<h2>Political and Commercial Pressure Mounts</h2>
<p>The planned UK festival appearances of Kanye West continued to generate significant controversy on Sunday after Pepsi announced it was withdrawing as the main sponsor of the Wireless festival, where the rapper is scheduled to headline. The move came following sustained pressure from campaigners and a number of public figures.</p>
<p>Prime Minister Keir Starmer added his voice to those expressing disquiet, saying he was "concerned" about the festival dates and questioning whether they should proceed, though he stopped short of calling for them to be cancelled outright.</p>
<h2>Pepsi's Withdrawal</h2>
<p>Pepsi said in a statement that it had "carefully considered its position" and concluded that it could not continue its association with the event given "ongoing concerns." The brand had been a major financial backer of the festival circuit for several years.</p>
<p>The festival's organisers said they were in discussions with alternative sponsors and maintained that the lineup would proceed as announced. Tickets for the West performances had sold out within hours of going on sale.</p>
<h2>Free Speech vs Responsibility Debate</h2>
<p>The episode has reignited debate about the limits of free speech in the context of live entertainment, and the responsibilities of sponsors, organisers, and government. Some artists have announced they will not appear on the same bill as West, while fan groups have been split on the question.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T13:37:00Z"),
  },
  {
    category: "uk",
    title: "Royal Family Gathers for Windsor Easter Sunday Service",
    excerpt: "Members of the Royal Family attended the traditional Easter Sunday service at Windsor Castle, though Prince Andrew and his family were notably absent from the gathering.",
    content: `<h2>Easter at Windsor</h2>
<p>The Royal Family gathered at Windsor Castle for the traditional Easter Sunday church service, with King Charles and Queen Camilla joined by the Prince and Princess of Wales and other working members of the family. The service, held at St George's Chapel, drew crowds of well-wishers who gathered on the Long Walk hoping to catch a glimpse of the royals.</p>
<p>It was the King's second public Easter since his cancer diagnosis and subsequent treatment, and observers noted he appeared in good spirits, pausing to greet members of the public after the service.</p>
<h2>Andrew's Continued Absence</h2>
<p>As has become the pattern at recent major royal events, Prince Andrew-Windsor and his daughters Princesses Beatrice and Eugenie were not present at the service. The Duke of York's exclusion from the official royal circle following his settlement in the civil lawsuit brought by Virginia Giuffre has become a fixture of the monarchy's new configuration.</p>
<p>Sources close to the Duke have indicated he considers the exclusion deeply unfair and continues to hope for a reconciliation with his brother the King, though no such rapprochement appears imminent.</p>
<h2>A Stable Institution</h2>
<p>Despite the various complications that have surrounded the Royal Family in recent years, the Easter gathering projected an image of institutional stability and continuity. Analysts noted that the Prince and Princess of Wales continue to attract significant popular affection and have emerged as the monarchy's most important public-facing asset.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T11:50:00Z"),
  },
  // POLITICS
  {
    category: "politics",
    title: "Judge Blocks Trump Administration From Collecting Student Race Data in 17 States",
    excerpt: "A federal judge has granted an emergency pause on the Trump administration's push to collect racial enrollment data from colleges and universities in 17 states, a significant early legal setback.",
    content: `<h2>Court Intervention</h2>
<p>A federal judge issued an emergency order on Friday pausing the Trump administration's effort to compel colleges and universities in 17 states to hand over detailed racial enrollment and admissions data. The ruling represents a significant early legal setback for the administration's campaign to enforce a broad interpretation of the Supreme Court's 2023 ruling ending affirmative action in admissions.</p>
<p>The administration had argued that the data collection was necessary to ensure compliance with the Students for Fair Admissions ruling. Opponents countered that it was an unprecedented and potentially unlawful overreach into state educational institutions.</p>
<h2>What the Data Would Have Shown</h2>
<p>The Education Department had demanded granular data on admitted students broken down by race, legacy status, athletic recruitment, and other factors. Critics argued that this level of detail went far beyond what was needed to verify legal compliance and suggested the administration was building a database for potential enforcement actions against specific institutions.</p>
<p>"This is about using data as a weapon," said the attorney general of one plaintiff state. "We are going to fight this every step of the way."</p>
<h2>Legal Battle Ahead</h2>
<p>The pause is temporary, with a full hearing scheduled for later this month. Legal observers expect the case to work its way through the appeals courts rapidly given its constitutional significance. Several civil rights organizations have filed amicus briefs supporting the challenge.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T00:51:00Z"),
  },
  {
    category: "politics",
    title: "Minneapolis ICE Raids Push Immigration Debate Into New Phase",
    excerpt: "Federal immigration enforcement operations in Minneapolis have intensified the national debate, as local officials, residents, and the White House stake out increasingly divergent positions.",
    content: `<h2>Federal Enforcement Escalates</h2>
<p>Federal immigration enforcement operations in Minneapolis have taken on a heightened intensity in recent weeks, with ICE agents conducting targeted and area enforcement actions that have drawn condemnation from the city's mayor, police chief, and members of Congress from the region.</p>
<p>The operations are part of a broader national enforcement surge that the Trump administration has described as essential to fulfilling its mandate on border security and immigration law. Officials point to the removal of individuals with criminal records as evidence of the operations' value.</p>
<h2>Community Impact</h2>
<p>Community advocates working in Minneapolis's large Somali and Hispanic immigrant populations describe a climate of pervasive fear, with residents avoiding hospitals, schools, and workplaces out of terror of arrest. "People are staying home. Children are not going to school. Businesses are closing early," said one community leader.</p>
<p>A local congressman described the operations as "indiscriminate" and called for a full accounting of the arrests made. The administration rejected this characterization, saying all detained individuals were properly screened.</p>
<h2>A National Inflection Point</h2>
<p>Polling shows the country deeply divided on the question of aggressive interior enforcement, even among those who support strict border control measures. Some Republican lawmakers from suburban districts have privately expressed concern about the political optics of high-profile enforcement actions in civilian communities.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T13:10:00Z"),
  },
  {
    category: "politics",
    title: "Hungary's Orbán Faces Election Threat as AI Disinformation Targets Rival",
    excerpt: "With a Hungarian election looming, AI-generated videos targeting Viktor Orbán's main challenger have emerged online, raising alarms about the technology's role in undermining democratic contests.",
    content: `<h2>Election Season in Hungary</h2>
<p>Hungary approaches a pivotal parliamentary election with Prime Minister Viktor Orbán facing the most credible electoral challenge of his sixteen years in power. An opposition coalition has rallied around a new leader who has successfully united previously fractured anti-Orbán forces, creating a genuine electoral contest for the first time in over a decade.</p>
<p>The tightening race has coincided with the emergence of what researchers are calling a sophisticated AI disinformation campaign targeting the opposition candidate.</p>
<h2>AI-Generated Attacks</h2>
<p>Multiple AI-generated videos depicting the opposition leader in fabricated compromising or embarrassing scenarios have circulated widely on Hungarian social media platforms and messaging apps. Researchers at several European disinformation monitoring organisations have confirmed the videos are synthetic, but their spread has proven difficult to contain.</p>
<p>The origin of the videos has not been definitively established, though opposition figures have pointed fingers at government-aligned media entities. The government has denied involvement.</p>
<h2>Democratic Implications</h2>
<p>"What we're watching in Hungary is a test case for how AI disinformation interacts with elections in countries where media freedom is already constrained," said one Budapest-based political analyst. "If it works here, it will be replicated elsewhere." European Union officials have urged Hungarian authorities to investigate the videos' origins.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T23:15:00Z"),
  },
  // CULTURE
  {
    category: "culture",
    title: "That 1966 Dylan-Lennon Limo Ride: What Were They Actually Talking About?",
    excerpt: "A haunting film sequence capturing Bob Dylan and John Lennon during a limo ride in 1966 has fascinated music fans for decades. Now, careful analysis reveals more about the subtext beneath the banter.",
    content: `<h2>The Most Famous Taxi Ride in Rock History</h2>
<p>In D.A. Pennebaker's fly-on-the-wall documentary footage from 1966, there is a sequence that has captivated music obsessives for decades: Bob Dylan and John Lennon, both at the peak of their respective powers and both apparently somewhat worse for wear, ride through London in the back of a limousine engaged in an exchange that has long resisted a single definitive interpretation.</p>
<p>The conversation is fragmented, elliptical, and at moments genuinely opaque. But for those willing to study it carefully, it contains more than it first appears.</p>
<h2>The Context</h2>
<p>In April 1966, Dylan was on his controversial world tour, the one that would culminate in the famous Manchester Free Trade Hall "Judas" concert. Lennon, meanwhile, was in the midst of what he would later describe as the most difficult and dissatisfying period of his life — trapped in Beatlemania with no clear artistic exit.</p>
<p>The two men had been circling each other's artistic orbits for years. Dylan had influenced The Beatles' move toward more literary and personal songwriting. The Beatles had pushed Dylan toward electric music. Their relationship was one of mutual fascination, influence, and underlying competitive tension.</p>
<h2>What Was Really Going On</h2>
<p>Behind the studied nonchalance of the limo footage, analysts see two extraordinarily prominent artists navigating a complex question of peer status. "Each man was trying to figure out exactly where he stood relative to the other," one music historian argues. "The banter is a kind of elaborate circling." The footage, available in full in the documentary "Eat the Document," remains one of the great primary sources for understanding the mid-1960s rock counterculture.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T09:00:00Z"),
  },
  {
    category: "culture",
    title: "Football Fashion Gets a Streetwear Makeover as Clubs Chase Youth Market",
    excerpt: "This season's kit launches reveal a striking shift toward streetwear aesthetics, with archive-inspired designs and oversized silhouettes blurring the line between fandom and fashion.",
    content: `<h2>The Pitch Meets the Street</h2>
<p>Walk through any major European city centre on a Saturday and you will notice something that would have seemed peculiar a decade ago: football shirts being worn not as sports kit but as fashion statements, tucked into wide-leg trousers, layered under long coats, or cropped and styled with accessories that have nothing to do with sport.</p>
<p>This season's club kit launches suggest that the sport's apparel designers are leaning into this crossover with unprecedented enthusiasm, producing collections that are explicitly designed to function both on the terraces and in the streets.</p>
<h2>Archive References and Retro Aesthetics</h2>
<p>Several major clubs have released kits this cycle that draw directly on designs from the 1980s and early 1990s, the era when football fashion was at its most unapologetically bold. Retro collar styles, thick graphic borders, and template designs unmistakably reminiscent of classic kits have all appeared in new launches.</p>
<p>The strategy is partly driven by the nostalgia economy but also by the extraordinary commercial value of the retro market. Vintage football shirts have become high-value collector's items, with rare 1990s originals regularly fetching hundreds of pounds.</p>
<h2>The Crop Top Controversy</h2>
<p>Most controversially, several women's team kits — and at least one men's training range — have incorporated cropped silhouettes, a choice that has generated heated debate on social media about the boundaries of sportswear design. Supporters argue it reflects contemporary fashion; critics say it prioritises aesthetics over functionality.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T23:01:00Z"),
  },
  // HUMAN INTEREST
  {
    category: "culture",
    title: "Woman, 95, Smashes Five More World Swimming Records Over Easter Weekend",
    excerpt: "Jane Asher, who took up competitive swimming in her 70s, has now set more than 100 Masters records in a career that has inspired water sports enthusiasts around the world.",
    content: `<h2>The Most Extraordinary Masters Swimmer Alive</h2>
<p>Jane Asher, 95, added five more world Masters swimming records to her extraordinary tally over the Easter weekend, competing in the 95-99 age group at a national championships meet and lowering her own marks in four individual events plus a relay.</p>
<p>Asher, who did not take up competitive swimming until her early 70s, has now set over 100 Masters world records across her career — a number that is almost certainly without parallel in any sport.</p>
<h2>Still Getting Faster</h2>
<p>What makes Asher's achievement particularly remarkable is that she continues to actively improve on her own performances rather than simply competing and winning against a limited field. Her 50-metre backstroke time this weekend was faster than her corresponding record from three years ago, a trajectory that swimming physiologists describe as essentially unprecedented in a nonagenarian competitor.</p>
<p>"She pushes herself every session," said her coach of 20 years. "She's not turning up to participate. She's turning up to race."</p>
<h2>An Inspiration at Any Age</h2>
<p>Asher's story has become a popular touchstone in discussions about healthy ageing and the capacity for athletic performance at advanced ages. She has spoken publicly about the role that structured exercise and competitive goals have played in maintaining her physical and cognitive health. "You have to keep chasing something," she has said. "The moment you stop, that's when things start going wrong."</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-01T05:12:00Z"),
  },
  {
    category: "world",
    title: "ICE Detention Expansion Divides Rural America: Small Town Rejects Federal Prison Plan",
    excerpt: "A small farming community known for supporting tough immigration policies has unanimously rejected federal plans to build a large ICE detention facility in their backyard.",
    content: `<h2>Not in Our Backyard</h2>
<p>The town of Weld County, nestled in the agricultural flatlands of the American interior, voted overwhelmingly at a packed town hall meeting to oppose federal plans to construct a major Immigration and Customs Enforcement detention facility on land adjacent to the community. The vote was notable because the town's residents are, by a significant majority, supporters of the Trump administration's immigration enforcement agenda.</p>
<p>"We support getting illegal immigration under control," said one local farmer who led the opposition. "But we're not a dumping ground. This facility would bring thousands of detainees, federal bureaucracy, and major road traffic through our farming community. That's not what we signed up for."</p>
<h2>A Local-Federal Clash</h2>
<p>The project was part of a broader federal push to rapidly expand detention capacity to house the increased numbers of people being swept up in interior enforcement operations. Federal officials had identified several rural communities as potential sites due to cheaper land and fewer planning obstacles.</p>
<p>Community meetings in several of these towns have produced similar results — local support for immigration enforcement in the abstract, combined with firm opposition to being the specific location chosen for its implementation.</p>
<h2>The Administration's Response</h2>
<p>ICE officials said they would assess alternative sites in the region. The administration has made rapid expansion of detention capacity a priority, arguing that it is essential for the credibility of the overall enforcement programme. The stand-off highlights the political complexities of translating broad immigration enforcement support into specific infrastructure decisions.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T00:06:00Z"),
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  // ── Admin user ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dailynews.com" },
    update: {},
    create: {
      email: "admin@dailynews.com",
      name: "Admin",
      password: passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin user: admin@dailynews.com / Admin@123456`);

  // ── Categories ──────────────────────────────────────────────────────────────
  const categoryMap: Record<string, string> = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, sortOrder: i },
    });
    categoryMap[cat.slug] = created.id;
    console.log(`✅ Category: ${cat.name}`);
  }

  // ── Articles ────────────────────────────────────────────────────────────────
  for (const article of ARTICLES) {
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);

    const wordCount = article.content.replace(/<[^>]+>/g, "").split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    await prisma.article.upsert({
      where: { slug },
      update: {},
      create: {
        title: article.title,
        slug,
        excerpt: article.excerpt,
        content: article.content,
        status: "PUBLISHED",
        publishedAt: article.publishedAt,
        isFeatured: article.isFeatured,
        readingTime,
        authorId: admin.id,
        categoryId: categoryMap[article.category],
      },
    });
    console.log(`✅ Article: ${article.title.slice(0, 60)}...`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log("Admin login:");
  console.log("  URL:      http://localhost:3000/auth/signin");
  console.log("  Email:    admin@dailynews.com");
  console.log("  Password: Admin@123456");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
