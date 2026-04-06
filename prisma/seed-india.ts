/**
 * India-focused seed: adds "Business" + "Entertainment" categories
 * and 50 India-centric articles.
 * Run: npx tsx prisma/seed-india.ts
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Extra categories ──────────────────────────────────────────────────────────
const NEW_CATEGORIES = [
  { name: "Business", slug: "business", color: "#b45309", description: "Indian and global business, markets and economy", sortOrder: 10 },
  { name: "Entertainment", slug: "entertainment", color: "#9333ea", description: "Bollywood, OTT, music and popular culture", sortOrder: 11 },
  { name: "India", slug: "india", color: "#e11d48", description: "National news from across India", sortOrder: 12 },
];

// ─── 50 India articles ─────────────────────────────────────────────────────────
const INDIA_ARTICLES = [

  // ═══════════════════════ INDIA POLITICS 12 ════════════════════════════════

  {
    category: "india",
    title: "PM Modi Chairs High-Level Security Meeting as Kashmir Border Tensions Rise",
    excerpt: "The Prime Minister convened an emergency session of the Cabinet Committee on Security as cross-border firing along the Line of Control entered a third consecutive day.",
    content: `<h2>Security Establishment on High Alert</h2>
<p>Prime Minister Narendra Modi chaired a high-level meeting of the Cabinet Committee on Security on Saturday evening, as Indian Army units along the Line of Control in Jammu and Kashmir reported a third day of sustained cross-border firing. The meeting lasted over two hours and was attended by the Defence Minister, the National Security Adviser, the Army Chief, and the chiefs of the Air Force and Navy.</p>
<p>Official sources confirmed that the meeting reviewed the operational situation along the LoC, intelligence assessments, and India's diplomatic communication with Islamabad. A senior government source said the situation was "serious but manageable," while stressing that the security forces were responding appropriately to provocation.</p>
<h2>What Happened on the Ground</h2>
<p>The firing, which began in the Pir Panjal range sector before spreading to other forward posts, has been attributed by Indian military officials to Pakistani border action force units and non-state elements. Three Indian soldiers were injured in the exchanges and have been evacuated to military hospitals. Pakistan's military has not issued a statement.</p>
<p>The Indian Army's Northern Command issued a statement confirming that it was maintaining "utmost vigil" and that all necessary defensive and retaliatory measures were in place. Security forces on the civilian side of the LoC have been placed on high alert, and additional CRPF columns have been deployed to forward villages in the affected districts.</p>
<h2>Diplomatic Dimensions</h2>
<p>India's Ministry of External Affairs summoned the Pakistani High Commissioner and lodged a formal protest. The foreign ministry spokesperson said India held Pakistan "directly responsible" for the firing and warned of "appropriate and proportionate responses." The incident comes at a sensitive time, just weeks before scheduled backchannel talks between the two countries' national security advisers in a third-country location.</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-05T09:00:00Z"),
  },
  {
    category: "india",
    title: "Maharashtra CM Unveils Rs 10 Lakh Crore Investment Policy; Manufacturing Push Centre Stage",
    excerpt: "The Maharashtra government's sweeping new industrial policy aims to attract Rs 10 lakh crore in investment by 2030, with a strong focus on semiconductor manufacturing and green energy.",
    content: `<h2>Largest State Industrial Policy in India's History</h2>
<p>Maharashtra Chief Minister Devendra Fadnavis unveiled what his government described as the most ambitious state industrial policy ever announced in India, targeting Rs 10 lakh crore in total investment by 2030 across manufacturing, infrastructure, and services. The policy, titled Maharashtra Industrial Vision 2030, was launched at a ceremony at the Bombay Exhibition Centre attended by leading industrialists and foreign diplomats.</p>
<p>The policy offers a graduated incentive structure based on investment size and employment potential, with the highest incentives reserved for semiconductor fabrication, electric vehicle manufacturing, and large-scale renewable energy projects. Units investing over Rs 10,000 crore in specified sectors will be eligible for a 25-year special economic benefit package including land at subsidised rates, power tariff subsidies, and stamp duty exemptions.</p>
<h2>Semiconductor Focus</h2>
<p>A dedicated semiconductor corridor in Pune-Nashik-Aurangabad is at the heart of the policy's ambitions. The state has already secured expressions of interest from two international chip manufacturers that it expects to announce formal agreements by June. Chief Minister Fadnavis said that Maharashtra was competing directly with Tamil Nadu, Telangana, and Gujarat for India's semiconductor investment pipeline.</p>
<p>"Maharashtra has the talent. Maharashtra has the infrastructure. Maharashtra has the political will. We will not lose this opportunity," the Chief Minister told the gathering.</p>
<h2>Critics and Concerns</h2>
<p>Opposition parties acknowledged the scale of the ambition while questioning the state's capacity to deliver on the incentives. "Maharashtra has a history of announcing massive investment targets and failing to translate them into actual job creation," said a Congress spokesperson. The state's financial position — with a fiscal deficit running above Rs 1 lakh crore — has also drawn concern from economists.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T07:00:00Z"),
  },
  {
    category: "india",
    title: "Supreme Court Modifies UAPA Bail Test in Landmark Ruling, Eases 'Prima Facie' Bar",
    excerpt: "In a judgment with wide implications for anti-terror prosecutions, the Supreme Court has clarified the standard courts must apply when considering bail under the Unlawful Activities Prevention Act.",
    content: `<h2>A Constitutional Balance</h2>
<p>The Supreme Court of India issued a landmark ruling on Saturday that modifies the test courts apply when considering bail applications under the Unlawful Activities (Prevention) Act, potentially easing one of the strictest bail regimes in Indian law. A three-judge bench including the Chief Justice held that the "prima facie true" standard in Section 43D(5) of UAPA must be read consistently with the constitutional presumption of innocence and the right to speedy trial under Article 21.</p>
<p>The court said that when an accused has been in custody for a prolonged period — particularly when trial has not yet commenced — courts must give greater weight to the personal liberty interest, even under UAPA, and that mechanical application of the prima facie test without considering factors like custody duration and trial delay amounted to a constitutional infirmity.</p>
<h2>What Changes</h2>
<p>The ruling does not strike down the prima facie standard or weaken the anti-terror law itself. Rather, it requires courts to conduct a holistic assessment that includes the likelihood of trial taking place within a reasonable timeframe, the accused's personal circumstances, and the proportionality of continued detention relative to the nature of the allegations.</p>
<p>Senior advocates who argued for a more liberal interpretation welcomed the decision. Government lawyers indicated they would study the judgment carefully before commenting on its implications for pending cases.</p>
<h2>Immediate Impact</h2>
<p>The ruling is expected to benefit several high-profile undertrials accused of UAPA offences who have been in custody for many years without trial commencing, including those in cases related to the Bhima Koregaon prosecutions and various terrorism-related matters in Jammu and Kashmir. Legal experts predict a wave of fresh bail applications will follow the judgment.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T11:00:00Z"),
  },
  {
    category: "india",
    title: "All-Party Meeting Called as Manipur Violence Flares: Fresh Incidents in Valley Districts",
    excerpt: "Union Home Minister Amit Shah has called an urgent all-party meeting after fresh violence in Manipur's Imphal East and Bishnupur districts left five dead and dozens displaced.",
    content: `<h2>Violence Returns to the Valley</h2>
<p>Fresh incidents of targeted killings and arson in Manipur's valley districts have prompted the Union Home Ministry to call an emergency all-party meeting after months of relative calm. Five people were killed in two separate incidents in Imphal East and Bishnupur over a 48-hour period, shattering a fragile peace that had held since November.</p>
<p>The killings are believed to be linked to a renewed round of inter-community tensions following a land dispute in Bishnupur that escalated into armed confrontation. Security forces have been deployed in large numbers to the affected areas and a curfew has been imposed in two subdivisions.</p>
<h2>Home Minister's Intervention</h2>
<p>Union Home Minister Amit Shah arrived in Imphal on Saturday morning for a review meeting with the Chief Minister and security commanders. He subsequently called representatives of all political parties, including the opposition Congress and regional parties, for talks aimed at developing a consensus response to the situation.</p>
<p>"The situation in Manipur requires the united response of all political forces," the Home Minister said. "I am here to listen to all stakeholders and to ensure that the full resources of the central government are deployed in support of lasting peace."</p>
<h2>Civil Society Response</h2>
<p>Civil society organisations from both communities issued a rare joint statement condemning the violence and calling for an independent investigation. "We have lost too many lives. We have spent too long in fear. We demand accountability and we demand peace — now," the statement read, signed by over 200 organisations from across the ethnic spectrum.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T06:00:00Z"),
  },
  {
    category: "india",
    title: "India's New Digital Personal Data Protection Rules Notified, Firms Get Six-Month Transition",
    excerpt: "The government has formally notified the rules under the Digital Personal Data Protection Act 2023, giving companies a six-month window to comply before penalties kick in.",
    content: `<h2>India's Privacy Regime Comes Into Force</h2>
<p>The Ministry of Electronics and Information Technology formally notified the detailed rules under the Digital Personal Data Protection Act 2023 on Saturday, setting the clock ticking on the most significant overhaul of India's data governance framework since the Information Technology Act of 2000. Companies processing personal data of Indian citizens now have six months to achieve full compliance before the penalties provision is activated.</p>
<p>The rules set out the obligations of data fiduciaries — entities that collect or process personal data — in areas including consent management, data localisation for sensitive personal data, breach notification timelines, and the appointment of data protection officers. The rules also constitute the Data Protection Board of India as the adjudicatory authority for disputes and penalty proceedings.</p>
<h2>Industry Response</h2>
<p>Industry bodies gave the rules a cautious welcome, appreciating the six-month transition window but noting residual ambiguity in several key definitions. The Internet and Mobile Association of India said it would issue detailed guidance for members navigating compliance, particularly around the definition of "significant data fiduciary" which triggers the most onerous obligations.</p>
<p>Foreign technology companies operating in India said they were studying the rules. One major US tech firm's counsel said the rules showed "meaningful improvement" from earlier drafts but that some data localisation provisions remained "commercially difficult."</p>
<h2>Civil Liberties and the Surveillance Question</h2>
<p>Civil liberties advocates welcomed the formal operationalisation of data rights while maintaining their long-standing concern about government exemptions. "The fundamental weakness remains the broad carve-out for state surveillance," said one prominent privacy lawyer. "A data protection regime that does not protect citizens from the state is only half a regime."</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-04T10:00:00Z"),
  },
  {
    category: "india",
    title: "Rajya Sabha Passes Landmark Labour Code Amendments in 3 AM Vote",
    excerpt: "The Upper House passed amendments consolidating four major labour codes in a dramatic late-night sitting, over the walkout of opposition parties.",
    content: `<h2>Night Sitting, High Stakes</h2>
<p>The Rajya Sabha passed amendments to the four consolidated labour codes in a sitting that extended past 3 AM on Saturday, after the ruling NDA alliance used its majority to resist opposition demands for referral to a parliamentary standing committee. The amendments cover the Code on Wages, the Industrial Relations Code, the Social Security Code, and the Occupational Safety, Health and Working Conditions Code.</p>
<p>The government had been under sustained pressure from industry bodies and state governments to clarify ambiguities in the codes that have so far prevented most states from framing their own rules — a prerequisite for the codes to take effect. The amendments address several of these ambiguities while also introducing a new national floor wage mechanism.</p>
<h2>What the Amendments Do</h2>
<p>Key changes include a clearer definition of "worker" that brings more gig economy workers into the social security net; a mandatory gratuity provision for gig workers employed for more than three years on a platform; and a strengthened dispute resolution mechanism for claims involving workers in special economic zones.</p>
<p>A new provision also allows states to establish sector-specific minimum wages above the national floor, which labour economists said was a significant departure from the original code's wage determination logic.</p>
<h2>Opposition Walkout</h2>
<p>The principal opposition Congress and several regional parties walked out before the vote, accusing the government of steamrolling legislation without adequate consultation with trade unions or workers' representatives. "These codes were never adequately debated. The amendments have been pushed through in darkness, literally," said a Congress Rajya Sabha leader.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T05:00:00Z"),
  },
  {
    category: "india",
    title: "Census 2025 Data Released: India's Population 1.46 Billion, Urban Share Crosses 40%",
    excerpt: "India's first census in 15 years reveals a population of 1.46 billion, a sharp slowdown in growth, and for the first time, more than 40% of Indians living in urban areas.",
    content: `<h2>A Nation Transformed</h2>
<p>The first data from India's long-delayed 2025 census has been released by the Registrar General and Census Commissioner of India, revealing a country that has changed profoundly in the fifteen years since the previous count. India's population stands at 1.461 billion as of the census reference date, representing a decadal growth rate of 12.4% — the lowest since independence and well below the 17.6% recorded in 2011.</p>
<p>The fertility transition that demographers had predicted has materialised: the Total Fertility Rate at the all-India level has fallen to 1.9, below the replacement level of 2.1 for the first time in India's recorded demographic history. Several southern states including Tamil Nadu, Kerala, and Andhra Pradesh have fertility rates below 1.7, raising questions about long-term labour supply and pension sustainability in those states.</p>
<h2>The Urban Surge</h2>
<p>For the first time, more than 40% of India's population — 593 million people — live in urban areas, up from 31% in 2011. The urban growth has been concentrated in secondary cities rather than the largest metros, with 47 new cities crossing the one-million population threshold since 2011. The National Capital Region now has a population of 46 million, making it one of the largest urban agglomerations in human history.</p>
<h2>Literacy and Age Structure</h2>
<p>The literacy rate has risen to 82.4% overall, with female literacy catching up rapidly at 78.9%. The age structure reveals a bulge in the 20-35 cohort that represents the peak of India's demographic dividend window — valuable human capital if adequately employed. "The next decade is the decade where India either captures this dividend or loses it permanently," said a senior economist at NIPFP.</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-03T10:00:00Z"),
  },
  {
    category: "india",
    title: "Electoral Bonds Final Compliance: SBI Submits Remaining Data to Election Commission",
    excerpt: "The State Bank of India has submitted the final tranche of electoral bond data to the Election Commission following a Supreme Court directive, completing the disclosure ordered in February 2024.",
    content: `<h2>Closure of a Historic Disclosure</h2>
<p>The State Bank of India on Friday submitted the final tranche of electoral bond purchase and redemption data to the Election Commission of India, completing compliance with the Supreme Court's historic February 2024 judgment that struck down the scheme. The submission covered bonds from the final redemption window before the scheme was shuttered.</p>
<p>The Election Commission confirmed receipt of the data and said it would publish the information on its website in accordance with the court's directions. The Commission said the published data would include complete denomination details, purchase dates, and redemption information for all bonds in the final tranche.</p>
<h2>What the New Data Shows</h2>
<p>Political analysts and journalists who have been tracking the data said the final tranche includes several large-denomination bond purchases made in the weeks immediately preceding the 2024 general election. Several of the purchasing entities are companies that were awarded significant government contracts or regulatory approvals in the period before their bond purchases, a pattern that had emerged as a consistent feature of the data already published.</p>
<h2>Where the Cases Stand</h2>
<p>Multiple petitions seeking criminal investigations into specific donor-beneficiary correlations are pending before various courts. The Supreme Court itself has declined to take up the criminal angle, saying the appropriate forum was the investigative agencies. Critics have noted that the investigating agencies — the CBI and ED — function under the executive and have shown little inclination to pursue cases involving ruling party contributions.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T14:00:00Z"),
  },
  {
    category: "india",
    title: "New Education Policy Implementation Review: Half of States Lagging on Key Reforms",
    excerpt: "A government assessment of NEP 2020 implementation reveals that over half of India's states are significantly behind schedule on foundational literacy, multilingual instruction, and vocational integration targets.",
    content: `<h2>Five Years On: An Honest Stocktake</h2>
<p>As the National Education Policy 2020 approaches its fifth anniversary, an internal assessment by the Ministry of Education has found that implementation has been deeply uneven, with fewer than half of India's states and union territories on track to meet the policy's flagship targets by the 2030 deadline. The document, obtained by news organisations through Right to Information applications, paints a candid picture of the gap between the policy's ambitions and ground reality.</p>
<p>The assessment covers the six largest reform areas under NEP: foundational literacy and numeracy mission, multilingual instruction up to Class 5, vocational education integration from Class 6, the semester system in higher education, the Academic Bank of Credits framework, and the multidisciplinary university model.</p>
<h2>Who Is Ahead, Who Is Behind</h2>
<p>Tamil Nadu, Kerala, Himachal Pradesh, and Gujarat emerge as the leading implementers on most parameters. Bihar, Uttar Pradesh, Madhya Pradesh, and Rajasthan are identified as significantly lagging, particularly on teacher training (a prerequisite for virtually every other reform) and on the foundational literacy mission which was meant to ensure all children can read and do basic arithmetic by Class 3.</p>
<p>"The foundational literacy gap is the most alarming finding," a senior ministry official said. "Everything else depends on children being able to read. Without that, no other reform can work."</p>
<h2>Funding and Accountability</h2>
<p>The assessment recommends a strengthened accountability framework under Samagra Shiksha that ties central funding more directly to implementation milestones, a proposal that has drawn pushback from state governments that argue it infringes on their constitutional rights over education.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-03T08:00:00Z"),
  },
  {
    category: "india",
    title: "Delhi's New Lieutenant Governor Triggers Constitutional Standoff Over Police Powers",
    excerpt: "A showdown between Delhi's AAP government and the newly appointed Lieutenant Governor over operational control of Delhi Police has plunged the capital into constitutional uncertainty once again.",
    content: `<h2>An Old Fight in a New Round</h2>
<p>Delhi's perennial constitutional conflict between its elected government and the Union-appointed Lieutenant Governor has flared again, this time over a directive from the new LG that effectively overrides a policy circular issued by the AAP-led government on police deployment in protest situations. The AAP government has challenged the directive in the Delhi High Court, arguing that it violates the Supreme Court's earlier ruling on the division of powers between the elected government and the LG.</p>
<p>The LG's office has maintained that policing is a Union subject under the NCT of Delhi Act and that the LG is not bound by the aid and advice of the council of ministers in this domain. The government has countered that the circular addresses civilian complaint procedures — an administrative matter — rather than operational policing.</p>
<h2>Political Backdrop</h2>
<p>The dispute has an obvious political dimension. The directive came days after opposition parties accused Delhi Police of excessive force during a demonstration against a government land acquisition policy in West Delhi. The AAP chief minister alleged that the LG was acting as a proxy for the Union government in suppressing political opposition.</p>
<p>The LG's spokesperson rejected the characterisation as "politically motivated" and accused the Delhi government of attempting to interfere with lawful policing.</p>
<h2>Legal Proceedings</h2>
<p>The Delhi High Court has scheduled an urgent hearing for Monday. Constitutional experts are divided on the merits, with some arguing that the Supreme Court's earlier ruling provides a clear framework and others suggesting the current facts raise genuinely novel questions about the scope of the earlier judgment.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T18:00:00Z"),
  },
  {
    category: "india",
    title: "India Ranks 111th on Global Press Freedom Index; Journalist Arrests at 10-Year High",
    excerpt: "Reporters Without Borders' annual index places India below neighbours Bangladesh and Nepal, as journalist arrests reach the highest level recorded since 2014.",
    content: `<h2>A Declining Trajectory</h2>
<p>India has ranked 111th out of 180 countries in the 2026 World Press Freedom Index published by Reporters Without Borders (RSF), a two-place decline from the previous year and a continuation of a trend that has seen the country fall over 40 positions in a decade. The organisation cited the sustained use of legal instruments including criminal defamation, sedition provisions — despite a Supreme Court stay on their use — and the Foreign Contribution Regulation Act against journalists and news organisations.</p>
<p>The report specifically names 38 journalists currently in pre-trial custody in India, the highest number since RSF began systematic country-level tracking in 2014. Jammu and Kashmir and the northeastern states account for a disproportionate share of the detentions.</p>
<h2>Government Rejects the Ranking</h2>
<p>The Ministry of Information and Broadcasting rejected the index, calling it "biased, politically motivated, and factually incorrect." A ministry statement pointed to the large number of active media organisations in India and the country's constitutional guarantee of press freedom as evidence that the report's conclusions were not grounded in reality.</p>
<h2>Journalists on the Ground</h2>
<p>Correspondents and freelance journalists working in regions like Manipur, Chhattisgarh, and J&K described a climate of self-censorship driven by fear of legal harassment. "You learn very quickly what you can write and what you can't," said one journalist who asked not to be identified. "It's not an external censor — it's the one in your own head, built by experience."</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T04:00:00Z"),
  },
  {
    category: "india",
    title: "Uniform Civil Code: Opposition States Refuse Compliance as 'Unconstitutional Imposition'",
    excerpt: "Eight non-BJP-ruled states have formally written to the Union government refusing to adopt the model Uniform Civil Code framework, setting the stage for a federal legal battle.",
    content: `<h2>Federal Fault Lines</h2>
<p>Eight opposition-ruled states — Tamil Nadu, Kerala, Karnataka, Telangana, Bengal, Punjab, Himachal Pradesh, and Jharkhand — have jointly written to the Union government announcing their refusal to adopt the model Uniform Civil Code framework that the central government circulated following Uttarakhand's implementation of its state UCC. The letters describe the framework as an "unconstitutional imposition" that violates the states' rights over personal law under the concurrent list.</p>
<p>The legal position of the states is contested. While Parliament clearly has the power to legislate a UCC under Article 44 of the Constitution (an explicit directive principle), the concurrent list means states also have rights in the space. The model framework approach — which invites states to adopt rather than mandating adoption — was itself an attempt to navigate this ambiguity.</p>
<h2>Political Calculations</h2>
<p>The refusal is driven as much by political as by legal reasoning. Each of the eight states has significant Muslim minority constituencies for whom the UCC has been a source of deep concern, particularly around the implications for personal law governing marriage, divorce, and inheritance under Islamic jurisprudence.</p>
<p>The BJP-ruled national government accused the refusing states of prioritising "vote bank politics over national unity," while non-BJP leaders argued they were defending constitutional federalism.</p>
<h2>The Union Government's Next Move</h2>
<p>Government sources indicated that the Union did not plan to force adoption through legislative means at this stage, but would instead allow the court of public opinion to develop. "We have a mandate from the people. The states that are refusing have their own reasons, and the public will judge them," a senior BJP leader said.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-03T12:00:00Z"),
  },

  // ═══════════════════════ BUSINESS / ECONOMY 10 ════════════════════════════

  {
    category: "business",
    title: "India Overtakes Japan to Become World's Third-Largest Economy: IMF Confirms",
    excerpt: "The International Monetary Fund's latest World Economic Outlook confirms that India has displaced Japan as the world's third-largest economy in purchasing power parity terms.",
    content: `<h2>A Milestone Two Decades in the Making</h2>
<p>India has officially overtaken Japan to become the world's third-largest economy in purchasing power parity terms, according to the International Monetary Fund's April 2026 World Economic Outlook. India's economy is now estimated at $15.8 trillion in PPP terms, compared to Japan's $14.1 trillion, placing India behind only the United States and China in the global economic hierarchy.</p>
<p>In nominal dollar terms — a measure more widely used in international financial comparisons — India at approximately $4.2 trillion remains behind Japan ($4.6 trillion), Germany ($5.0 trillion), and the UK ($3.9 trillion). However, the trajectory is unmistakable: India is expected to surpass Japan and Germany on nominal terms by 2027-28 at current growth differentials.</p>
<h2>IMF Growth Forecasts</h2>
<p>The IMF projects India will grow at 6.8% in the fiscal year 2026-27, the fastest among major G20 economies, while Japan is projected to contract marginally and Germany to grow at 1.1%. The Fund attributed India's growth to strong domestic consumption, public infrastructure investment, and the early-stage benefits of the production-linked incentive scheme in manufacturing.</p>
<h2>What It Means — and What It Doesn't</h2>
<p>Economists cautioned against over-interpreting the headline figure. On a per-capita income basis, India remains a lower-middle-income country. "India is a large economy with hundreds of millions of poor people," said one New Delhi-based development economist. "The aggregate ranking is significant, but the distribution question is the urgent one." Social indicators — on healthcare, nutrition, and basic services — continue to lag behind countries with comparable aggregate income levels.</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-04T10:30:00Z"),
  },
  {
    category: "business",
    title: "Sensex Crosses 1,00,000 Mark for the First Time in Historic Trading Session",
    excerpt: "The BSE Sensex breached the one-lakh barrier on Friday in a session marked by euphoria, strong FII inflows, and a rally led by financial and IT stocks.",
    content: `<h2>A Landmark Day on Dalal Street</h2>
<p>The BSE Sensex crossed the 1,00,000-point mark for the first time in history during Thursday afternoon trading, triggering celebrations on the floor of the Bombay Stock Exchange and prompting Prime Minister Modi to tweet congratulations to India's investors. The benchmark index eventually closed at 1,00,342 points, a gain of 1.8% on the day.</p>
<p>The milestone was driven by a combination of factors: strong quarterly results from India's largest banks and IT companies, a surge in foreign institutional investor inflows following the IMF's upward revision of India's growth forecast, and a globally risk-on sentiment following the US Federal Reserve's signal of a potential rate cut in June.</p>
<h2>What Drove the Rally</h2>
<p>Financial stocks led the advance, with HDFC Bank, ICICI Bank, and State Bank of India all posting new 52-week highs. The IT sector followed, buoyed by a weaker rupee that improves the dollar earnings of export-oriented software companies. The rally was broad-based, with over 70% of Sensex constituents closing in positive territory.</p>
<p>The NSE Nifty 50 also crossed a milestone, settling above 30,000 points for the first time.</p>
<h2>Caution Amid Celebrations</h2>
<p>Market veterans urged caution. The Sensex's price-to-earnings ratio has now reached 24x forward earnings — a level that leaves limited margin for error if growth disappoints. "Valuations have priced in a lot of good news," said one veteran fund manager. "Any negative surprise — a global risk-off event, an earnings miss by the heavyweights — could be painful." Retail investor participation has also reached record levels, raising concern about potential volatility driven by less experienced participants.</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-03T16:00:00Z"),
  },
  {
    category: "business",
    title: "RBI Holds Repo Rate at 6%, Warns of Global Tariff Uncertainty",
    excerpt: "The Reserve Bank of India's Monetary Policy Committee voted unanimously to hold the repo rate, citing uncertainty from US trade tariffs while maintaining its 'accommodative' stance.",
    content: `<h2>Steady as She Goes</h2>
<p>The Reserve Bank of India's Monetary Policy Committee voted unanimously to hold the benchmark repo rate at 6% at its April meeting, pausing after two consecutive rate cuts in December 2025 and February 2026. The Governor's post-meeting statement emphasised the global uncertainty created by the US administration's new tariff regime as a key risk to India's export outlook and external account position.</p>
<p>The RBI revised its FY27 GDP growth projection down marginally from 6.9% to 6.8%, citing weaker-than-expected export performance in the March quarter and continued softness in rural consumption. Inflation, however, was revised down to 4.1% from 4.3% on the back of easing food prices.</p>
<h2>The Governor's Assessment</h2>
<p>Governor Sanjay Malhotra said the MPC remained "vigilant" on global spillovers and would not hesitate to act if conditions warranted. He stressed that the RBI's priority was maintaining domestic macroeconomic stability and anchoring inflation expectations, and that the sequence of any further policy changes would be data-dependent.</p>
<p>On the rupee, which has weakened to Rs 86.4 against the dollar, the Governor said the currency would continue to reflect market forces and that the RBI's interventions were aimed only at reducing excessive volatility rather than defending any particular level.</p>
<h2>Market and Industry Reaction</h2>
<p>Bond markets responded positively, with the 10-year yield softening to 6.68%. Industry bodies expressed mild disappointment at the hold, with several chambers hoping for a further cut to support credit growth and capital expenditure. Banks' net interest margins, which remain under pressure, were expected to see some stabilisation from the hold decision.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T12:00:00Z"),
  },
  {
    category: "business",
    title: "Mukesh Ambani Steps Down as Reliance Chairman; Son Akash Takes the Reins",
    excerpt: "In the most anticipated succession in Indian corporate history, Mukesh Ambani has handed over the chairmanship of Reliance Industries to his son Akash, ending a 27-year reign at the helm.",
    content: `<h2>The End of an Era</h2>
<p>Mukesh Ambani stepped down as Chairman of Reliance Industries Limited on Friday, handing over the position to his eldest son Akash Ambani in a succession that has been in preparation for several years but still marks a historic turning point for India's largest conglomerate and one of its most consequential business empires.</p>
<p>Mukesh Ambani, 68, will continue as a Non-Executive Director and a member of the Board's strategic advisory committee, maintaining a guiding role without day-to-day executive responsibilities. His daughter Isha Ambani retains her role as head of Reliance Retail, and his younger son Anant Ambani continues to lead the Jio Platforms work on AI and new media.</p>
<h2>Akash's Track Record</h2>
<p>Akash Ambani, 33, has been Chairman of Reliance Jio Infocomm since 2023 and has overseen the telecom unit's expansion into 5G, streaming, and enterprise cloud services. Under his leadership, Jio has become one of Asia's largest telecom platforms by subscriber base, and its financial services and e-commerce verticals have shown robust growth. He is widely regarded within the company and by analysts as having absorbed both the strategic instincts and the operational discipline of his father.</p>
<h2>Markets React</h2>
<p>Reliance shares were flat in morning trading following the announcement, which had been widely anticipated. Analysts said the market's equanimity reflected confidence in the succession planning. "This has been telegraphed for years. Investors are not surprised. The interesting question is where Akash takes the company strategically beyond what his father built," said one equity analyst. Reliance has already signalled ambitious expansion in AI infrastructure, new energy, and global retail.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T09:00:00Z"),
  },
  {
    category: "business",
    title: "Adani Group Announces Rs 2 Lakh Crore Green Energy Investment Over Five Years",
    excerpt: "Gautam Adani unveiled the Adani Green New Era plan at a Delhi summit, committing the group to become the world's largest single renewable energy company by 2030.",
    content: `<h2>The World's Biggest Green Bet</h2>
<p>Adani Group Chairman Gautam Adani announced on Friday that the conglomerate would invest Rs 2 lakh crore — approximately $24 billion — in renewable energy infrastructure over the next five years, reaffirming its commitment to becoming the world's largest single renewable energy company by installed capacity by 2030. The announcement was made at the India Clean Energy Summit in New Delhi, attended by government officials, international investors, and industry representatives.</p>
<p>Adani Green Energy, the group's listed renewable energy arm, currently has over 35 GW of capacity under operation and development, making it already one of the world's largest single-entity green energy companies. The new commitment would add approximately 60 GW of additional capacity — predominantly solar, with a growing component of offshore wind and green hydrogen production.</p>
<h2>Rehabilitation Since 2023</h2>
<p>The announcement continues the Adani Group's strategic emphasis on renewable energy and domestic infrastructure since the turbulence of the Hindenburg Research report in early 2023. The group has steadily rebuilt investor confidence through asset monetisation, de-leveraging, and a clearer governance structure, and its listed entities have recovered to — and in several cases surpassed — their pre-2023 valuations.</p>
<h2>The Green Hydrogen Dimension</h2>
<p>A significant portion of the new investment is earmarked for green hydrogen production and supply chain infrastructure, including electrolyser manufacturing and ammonia production. Adani said green hydrogen would be a "transformative" business within the group's portfolio by 2030, targeting both the domestic fertiliser industry and international export markets. The group's collaboration with TotalEnergies on this vertical is expected to deepen.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T08:00:00Z"),
  },
  {
    category: "business",
    title: "India's Forex Reserves Cross $700 Billion for the First Time",
    excerpt: "India's foreign exchange reserves have breached the $700 billion mark for the first time, providing a comfortable buffer against global financial volatility.",
    content: `<h2>A Historic Reserve Threshold</h2>
<p>India's foreign exchange reserves crossed $700 billion for the first time as of the week ending April 4, 2026, according to data released by the Reserve Bank of India. The reserves stood at $701.4 billion, comfortably above the $640 billion level recorded a year ago. The milestone is seen as a significant marker of India's external financial resilience.</p>
<p>The surge in reserves has been driven by strong foreign direct investment inflows, robust services export earnings (particularly software and business process outsourcing), and significant portfolio investment by foreign institutional investors attracted by India's high growth differential. Remittance flows — India is perennially among the world's top recipients — have also continued at a record pace.</p>
<h2>Import Cover and Stabilisation</h2>
<p>At the current level of imports, India's reserves provide approximately 10.4 months of import cover, well above the conventional three-month minimum and above the levels maintained by most comparable economies. This buffer gives the RBI significant capacity to intervene in currency markets to prevent excessive rupee volatility without depleting reserves to uncomfortable levels.</p>
<p>The reserves also provide room for India to absorb a potential episode of capital flow reversal — a risk that has increased with global uncertainty driven by US tariff policy and the Fed's rate outlook.</p>
<h2>Gold and Other Components</h2>
<p>India's gold reserves, part of the overall figure, have risen to $65 billion following the RBI's consistent policy of adding gold to its portfolio as a diversification away from dollar assets. Special Drawing Rights with the IMF and India's reserve tranche position make up the remainder.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T13:00:00Z"),
  },
  {
    category: "business",
    title: "India-EU Free Trade Agreement: Final Round of Talks Concludes in Brussels",
    excerpt: "Indian and EU negotiators have completed the final technical round of free trade agreement negotiations, with a political sign-off expected at the June India-EU summit.",
    content: `<h2>Decades in the Making</h2>
<p>India and the European Union concluded what negotiators described as the "final technical round" of their free trade agreement talks in Brussels this week, raising expectations of a political-level sign-off at the India-EU Leaders Summit scheduled for July. Negotiations on the agreement, which would be India's most significant trade deal since independence, have been ongoing since 2007 with a resumption following a nine-year break in 2022.</p>
<p>India's commerce minister and the EU's Trade Commissioner issued a joint statement saying "all major technical issues have been resolved" and expressing confidence that a concluded agreement awaited only "final political alignment" at the leaders' level. The statement did not specify on which chapters final technical resolution had been achieved.</p>
<h2>What's in the Deal</h2>
<p>The agreement, when concluded, is expected to eliminate tariffs on approximately 90% of goods traded between India and the EU over a 10-year phase-in period. Key sectors of interest to India include textiles, pharmaceuticals, gems and jewellery, and software services (through the services chapter). The EU's main interests are in automobiles, wine and spirits, medical devices, and market access for European financial services companies.</p>
<h2>Outstanding Sensitivities</h2>
<p>Despite the optimistic framing, trade experts noted that dairy products — a politically sensitive sector in both parties — and the EU's carbon border adjustment mechanism as it applies to Indian exports remained areas of potential last-minute difficulty. "The technical round conclusion is genuine progress. Whether the political alignment follows on schedule is a separate question," said one Geneva-based trade law expert.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-03T11:00:00Z"),
  },
  {
    category: "business",
    title: "Startup Funding: India Records Best Q1 Since 2022 with $5.5 Billion in Investments",
    excerpt: "India's startup ecosystem bounced back in the first quarter of 2026, recording $5.5 billion in venture and growth capital investment — the best Q1 since the 2021-22 boom.",
    content: `<h2>Green Shoots Become a Harvest</h2>
<p>India's startup ecosystem has recorded $5.5 billion in venture and growth capital investment in the January-March 2026 quarter, according to data aggregated by Tracxn and Inc42, making it the strongest Q1 since the peak of the global venture capital boom in 2021-22. The improvement reflects both a recovery in global investor risk appetite and India-specific factors including the country's strong economic growth story and a maturing startup ecosystem with several successful exits providing returns to early investors.</p>
<p>The fintech sector led deal volumes, accounting for $1.8 billion in funding across 42 deals. SaaS for enterprise clients was the second-largest segment at $1.1 billion. D2C brands, electric vehicles, and health-tech each attracted between $300 and $500 million.</p>
<h2>Large Deals</h2>
<p>Three particularly large transactions drove the headline figure. A $600 million Series E for a Bengaluru-based enterprise AI platform serving global clients was the quarter's single largest deal. A $400 million fundraise by a Mumbai-based digital lending NBFC, and a $350 million investment round for a Chennai-based climate-tech company focused on industrial heat decarbonisation, rounded out the top three.</p>
<h2>Quality Over Quantity</h2>
<p>Despite the strong headline number, the deal count at 287 was well below the 500+ quarterly run rate of 2021-22. "This is a healthier ecosystem," said one managing partner at a top-tier India-focused venture fund. "Investors are doing more careful diligence, valuations are more realistic, and the companies getting funded are genuinely strong."</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-02T09:00:00Z"),
  },
  {
    category: "business",
    title: "Air India Mega-Deal: 50 Widebody Jets Ordered as Tata Group Completes Fleet Overhaul",
    excerpt: "Air India has placed a firm order for 50 Airbus A350 and A330neo aircraft, the final tranche of the Tata Group's massive fleet renewal programme that began with a 470-aircraft order in 2023.",
    content: `<h2>Tata's Transformation of India's Flagship Carrier</h2>
<p>Air India has signed a firm order for 50 widebody aircraft — 20 Airbus A350-900s and 30 A330neo-900s — completing the Tata Group's comprehensive fleet replacement programme that began with a historic 470-aircraft order announced in February 2023. The deal, valued at approximately $15 billion at list prices, was confirmed in a ceremony in Paris attended by Air India's CEO and Airbus Chief Commercial Officer.</p>
<p>The aircraft will be used primarily for Air India's long-haul routes to Europe, North America, and Australasia, replacing an ageing fleet of Boeing 777s and 787s. Deliveries are scheduled to extend from 2027 through 2031, ramping up capacity significantly on key routes where Air India has been limited by fleet availability.</p>
<h2>The Returns So Far</h2>
<p>Under Tata Group ownership since January 2022, Air India has significantly improved its on-time performance, customer service ratings, and financial position. The airline reported an operating profit for the third consecutive quarter in Q3 FY26, the first sustained profitability in decades. Customer satisfaction scores on international routes have improved from the bottom quartile to the mid-range of global full-service carriers.</p>
<h2>Competition Intensifies</h2>
<p>The fleet expansion will bring Air India into more direct competition with IndiGo, which has also been aggressively expanding its international operations, and with Gulf carriers Emirates, Etihad, and Qatar Airways on the Europe-India market. Vistara's absorption into Air India, completed last year, has already added capacity on some routes. The battle for India's rapidly expanding international travel market is intensifying.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-02T12:00:00Z"),
  },
  {
    category: "business",
    title: "HDFC Bank Q4 Results: Profit Up 22%, Asset Quality Improves Across All Segments",
    excerpt: "India's largest private sector bank posted a 22% rise in net profit for the March quarter, with gross NPAs falling to their lowest level since the pandemic and strong growth in retail credit.",
    content: `<h2>Another Strong Quarter for the Banking Giant</h2>
<p>HDFC Bank reported a 22% year-on-year increase in standalone net profit to Rs 17,620 crore for the fourth quarter of fiscal year 2026, exceeding analyst estimates and capping what the management described as a year of "consolidation and quality improvement" following the bank's mega-merger with HDFC Limited in 2023.</p>
<p>Net interest income grew 18% to Rs 31,980 crore, driven by strong growth in retail and SME loan books. Non-interest income was flat year-on-year, reflecting the bank's conservative approach to fee income in a regulatory environment where the RBI has been scrutinising fee practices across the sector.</p>
<h2>Asset Quality Turnaround</h2>
<p>The most encouraging element of the results was the improvement in asset quality. Gross non-performing assets fell to 1.24% of advances, the lowest level since March 2020 and well below the management's own internal target. Net NPAs at 0.38% were also at a multi-year low. Provision coverage improved to 72%, providing a strong buffer against any deterioration in credit quality.</p>
<p>The improvement was broad-based, with agriculture, MSME, and personal loan segments all showing reduced slippage compared to the previous year.</p>
<h2>Merger Integration Complete</h2>
<p>Senior management confirmed that the integration of HDFC Limited's mortgage book into the bank is now complete from both a systems and a regulatory capital perspective. The bank's capital adequacy ratio at 18.4% is now fully reflective of the merged entity's consolidated position and remains comfortably above regulatory minimums.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-01T14:00:00Z"),
  },

  // ═══════════════════════ TECHNOLOGY ══════════════════════════════════════

  {
    category: "technology",
    title: "Jio Launches 6G Trials in Mumbai and Delhi; Claims 10 Gbps Peak Speeds",
    excerpt: "Reliance Jio has begun 6G technology trials across select corridors in Mumbai and Delhi, achieving peak throughput of 10 Gbps — a 10x improvement over its existing 5G network.",
    content: `<h2>India's 6G Ambition Begins to Materialise</h2>
<p>Reliance Jio kicked off 6G technology field trials across twenty pre-selected network corridors in Mumbai and Delhi on Friday, achieving peak downloads speeds of 10 gigabits per second in optimal conditions and demonstrating sub-millisecond latency performance. The trials, conducted using experimental spectrum authorised by the Department of Telecommunications, mark the formal beginning of India's 6G research and development deployment phase.</p>
<p>Jio is collaborating with Samsung, Ericsson, and Indian Institute of Technology researchers on the trial, using a combination of terahertz spectrum (for ultra-high-speed applications) and enhanced sub-6 GHz spectrum for coverage. The company's vice chairman Akash Ambani, who also chairs Jio's parent Reliance, described the trials as "the foundation of India's leadership in the next generation of connectivity."</p>
<h2>Technical Parameters</h2>
<p>The trials tested multiple 6G use cases including holographic communication, AI-native radio resource management, and a joint sensing-and-communication application being explored for smart city vehicle management. The "AI-native" architecture — where AI is built into the network itself rather than added as an overlay — is a distinguishing feature of 6G over 5G that is expected to dramatically improve spectral efficiency.</p>
<h2>Timeline to Commercial Launch</h2>
<p>Global consensus targets 2030 as the earliest realistic date for commercial 6G deployment. Jio's management was careful not to indicate a specific Indian commercial timeline, but suggested that a phased rollout beginning in the country's largest metros before 2032 was achievable if spectrum policy and backhaul infrastructure developed on schedule.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T08:00:00Z"),
  },
  {
    category: "technology",
    title: "Infosys Wins $1.5 Billion Deal with German Banking Giant; Largest Single Contract Ever",
    excerpt: "Infosys has secured a 10-year, $1.5 billion technology transformation contract from a top-five German bank, the single largest contract win in the company's 45-year history.",
    content: `<h2>A Historic Deal for India IT</h2>
<p>Infosys announced on Friday that it had signed a €1.4 billion (approximately $1.52 billion) ten-year technology transformation contract with Commerzbank AG, the German financial services group. The deal — which Infosys confirmed is the largest single contract in its history — will see the Bengaluru-based IT services company take over the management and modernisation of Commerzbank's core banking infrastructure, data analytics platforms, and cybersecurity operations.</p>
<p>Infosys CEO Salil Parekh described the contract as "a vote of confidence in the quality of Indian technology talent and our ability to deliver transformation at scale for global financial institutions." The deal is expected to add approximately $150 million annually to Infosys's recognised revenue once fully ramped, and demonstrates the continued appetite among European financial firms for large-scale technology outsourcing to Indian vendors.</p>
<h2>What the Transformation Involves</h2>
<p>The engagement covers a migration of Commerzbank's current heterogeneous core banking landscape onto a modern cloud-native platform, the implementation of an enterprise data mesh architecture enabling real-time analytics, and a managed security operations centre serving the bank's operations across Germany and its international branches. Infosys will deploy approximately 6,000 professionals on the engagement at peak.</p>
<h2>Competitive Context</h2>
<p>The win comes at the expense of incumbent vendors including Capgemini and a consortium of European systems integrators. It reflects a broader trend of European financial institutions increasingly comfortable awarding large, complex engagements to Indian vendors, reversing an earlier preference for European IT partners even at higher cost. TCS and Wipro have also secured significant European financial services contracts in the past eighteen months.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T07:00:00Z"),
  },
  {
    category: "technology",
    title: "UPI Records 18 Billion Transactions in March 2026: A New Monthly Record",
    excerpt: "India's Unified Payments Interface processed 18.06 billion transactions worth Rs 24.8 lakh crore in March 2026, setting a new record for both volume and value in a single month.",
    content: `<h2>The World's Largest Real-Time Payments Network Keeps Growing</h2>
<p>The National Payments Corporation of India released March 2026 data showing that the Unified Payments Interface processed 18.06 billion transactions with a total value of Rs 24.77 lakh crore (approximately $288 billion) during the month — new records on both measures. The volume data represents a 38% year-on-year increase and confirms UPI's status as the world's largest real-time payments network, processing more transactions than Visa and Mastercard's global volumes combined.</p>
<p>Per-day transaction counts averaged 582 million in March, a figure that astonishes payments industry observers outside India. The quarter-end peak on March 31 saw over 900 million transactions processed in a single day, a global record for any single real-time payments infrastructure.</p>
<h2>Credit on UPI Accelerates</h2>
<p>A notable structural development in the March data was the continued rapid growth of credit-line-based UPI transactions, introduced in 2023 as a way to extend credit access to customers of formal financial institutions through the UPI interface. These transactions grew 156% year-on-year and now represent approximately 12% of total UPI value, up from 5% a year ago. The credit-on-UPI mechanism is seen as a potentially transformative tool for financial inclusion.</p>
<h2>International Expansion</h2>
<p>NPCI International continues to expand UPI acceptance globally. The March data included the first full month of transaction data from UPI's acceptance in France, adding to its presence in the UAE, Singapore, Malaysia, Nepal, Bhutan, and several other countries. Plans for a UK rollout by end-2026 are at an advanced stage.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-01T12:00:00Z"),
  },
  {
    category: "technology",
    title: "IIT Bombay Spinout Raises $200 Million to Deploy AI Diagnostics in 10,000 Rural Clinics",
    excerpt: "A medical AI spinout from IIT Bombay has raised a $200 million Series C to scale its diagnostic AI platform to rural primary health centres across India.",
    content: `<h2>AI Meets the Last Mile</h2>
<p>Niramai Health Analytix, an AI diagnostics company that originated in research at IIT Bombay, announced a $200 million Series C funding round led by Temasek and the Gates Foundation's investment arm with participation from Manipal Group and a consortium of Indian insurance companies. The funding will be used to deploy the company's AI-powered diagnostic platform — which can screen for tuberculosis, diabetic retinopathy, anaemia, and several other conditions from minimal clinical inputs — to 10,000 primary health centres across rural India by 2028.</p>
<p>The platform uses a combination of thermal imaging, a low-cost connected device kit, and cloud-based AI models to enable community health workers with minimal medical training to conduct screenings that would otherwise require a physician and specialised equipment. The screening results are transmitted in real time to a supervising doctor for review.</p>
<h2>Clinical Evidence</h2>
<p>The company published a peer-reviewed study in The Lancet Digital Health earlier this year demonstrating that its TB screening tool achieved 89% sensitivity and 82% specificity in a multi-centre trial across high-burden districts in Uttar Pradesh and Bihar — comparable to standard GeneXpert testing at a fraction of the cost per screen. The Gates Foundation co-investment is predicated on the potential to extend this model to Sub-Saharan Africa.</p>
<h2>The Talent Story</h2>
<p>The founding team of five includes three IIT Bombay computer science alumni working alongside two public health specialists from AIIMS. It represents an increasingly common pattern in India's healthcare innovation ecosystem: IIT and IISc-trained engineers teaming with clinical researchers to tackle applied healthcare access problems. Several other IIT spinouts in the diagnostics and digital health space have attracted significant funding in the past 18 months.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-03T09:00:00Z"),
  },
  {
    category: "technology",
    title: "India's National AI Mission Announces Rs 10,000 Crore Compute Allocation",
    excerpt: "The government has announced the allocation of Rs 10,000 crore for AI compute infrastructure under the National AI Mission, including the commissioning of India's first 10,000-GPU sovereign AI cluster.",
    content: `<h2>India Builds Its AI Infrastructure</h2>
<p>The Ministry of Electronics and Information Technology announced final approval of the AI compute infrastructure allocation under the IndiaAI Mission, committing Rs 10,372 crore to the procurement and operation of a sovereign AI compute cluster and the provisioning of subsidised compute access for Indian AI startups, academic researchers, and government agencies. The announcement was made by the Minister at the India AI Summit in Delhi.</p>
<p>The compute cluster — the first phase of which will comprise 10,240 Nvidia H100 GPUs plus an Indian-designed interconnect — will be located at a new data centre facility in the outskirts of Hyderabad, chosen for power availability, cooling infrastructure, and connectivity. Ministry officials expect the facility to be operational by December 2026.</p>
<h2>Access Model</h2>
<p>Unlike some international sovereign AI compute programmes that primarily benefit large incumbents, India's model distributes access through a competitive allocation process. Indian AI startups will receive subsidised compute at set prices — a fraction of commercial cloud costs — for training models and running inference workloads. NASSCOM has estimated that the compute subsidy could save the Indian AI startup sector collectively over Rs 3,500 crore per year at current commercial pricing.</p>
<h2>Concerns About Adequacy</h2>
<p>Critics from the technology community argued that 10,000 H100 GPUs, while significant for India, is modest relative to the compute available to leading AI labs in the US and China and will not be sufficient to train frontier foundation models. "It will help startups fine-tune existing foundation models and build Indian-language AI applications," said one senior AI researcher. "It won't make India competitive in the global foundation model race. That requires different thinking."</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-03T14:00:00Z"),
  },
  {
    category: "technology",
    title: "Tata Motors Celebrates 1 Million EV On Road in India; Nexon EV Leads Sales Chart",
    excerpt: "Tata Motors has crossed the milestone of one million electric vehicles on Indian roads, cementing its dominance in the country's EV market with a 65% market share.",
    content: `<h2>A Million EVs and Counting</h2>
<p>Tata Motors marked a significant milestone on Saturday as the company's live vehicle odometer data confirmed the one-millionth Tata electric vehicle operating on Indian roads. The company, which pioneered the mainstream EV market in India with the Nexon EV in 2020, has grown its EV portfolio to nine models spanning passenger cars, SUVs, commercial vehicles, and buses, and commands approximately 65% of India's electric passenger vehicle market.</p>
<p>The Nexon EV remains the country's best-selling electric vehicle, followed by the Tiago EV and the recently launched Harrier EV. The company's commercial vehicle division has separately supplied over 4,500 electric buses to city transport corporations across 28 states under the PM e-Bus Sewa scheme.</p>
<h2>The Infrastructure Challenge</h2>
<p>Tata Motors has invested alongside its charging infrastructure associate Tata Power to deploy over 100,000 public and semi-public charging points across India, the country's largest private charging network. Despite this investment, range anxiety and the perceived inadequacy of charging infrastructure relative to petrol/CNG alternatives remains the single biggest barrier cited by potential EV buyers in consumer surveys.</p>
<h2>The Path to 10 Million</h2>
<p>Tata Motors' management outlined ambitious targets for the next four years, aiming for a cumulative 10 million EVs on Indian roads from across all manufacturers by 2030 (of which it expects to supply approximately 40%, sharing the market more broadly with Mahindra, Hyundai, and new entrants). Achieving this target will require sustained improvement in charging infrastructure, battery cost reductions, and the expansion of EV credit financing options to smaller cities and rural markets.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-02T11:00:00Z"),
  },
  {
    category: "technology",
    title: "ISRO Gaganyaan: Final Crew Module Parachute Test Passes, Launch Now Three Months Away",
    excerpt: "ISRO has successfully completed the final qualification test of Gaganyaan's crew module parachute recovery system, clearing the last major technical hurdle before India's first crewed spaceflight.",
    content: `<h2>Almost Ready for India's First Crewed Mission</h2>
<p>The Indian Space Research Organisation has successfully completed the final qualification test of the crew module descent and recovery system — the parachute-based deceleration stack that will slow the Gaganyaan capsule to safe splashdown velocity in the Bay of Bengal on return from orbit. The test, conducted at the test range near Chennai, validated the performance of the main parachutes, the drogue chutes, and the jettison mechanisms under conditions designed to simulate the most demanding operational scenario.</p>
<p>The successful test clears what ISRO officials described as the final major technical qualification milestone before the G1 crewed mission. The current launch window is set for early July 2026, a date that has now held firm for four months following the comprehensive technical reviews that followed the rebaseline after 2023's delays.</p>
<h2>The Four-Member Crew</h2>
<p>India's four Gaganyaan astronauts — all Air Force test pilots — have been training for over four years at ISRO's training facility and at the Yuri Gagarin Cosmonaut Training Centre in Russia. The G1 mission profile involves a three-day orbit at 400km altitude, conducting 17 microgravity experiments selected from a national competition involving researchers from IITs, IISERs, and AIIMS, before a manual atmospheric re-entry and parachute splash-down recovery.</p>
<h2>National Pride and CSCS</h2>
<p>Gaganyaan will make India only the fourth country — after the Soviet Union/Russia, the United States, and China — to independently launch humans into space. ISRO chairman V. Narayanan said the mission would "open a new chapter" in India's space programme and serve as the foundation for a permanent Indian space station and eventual lunar missions. Schools across the country have been invited to participate in a countdown event linked to the launch.</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-03T15:00:00Z"),
  },
  {
    category: "technology",
    title: "WhatsApp Introduces UPI Payments to 500 Million Indian Users After Regulatory Clearance",
    excerpt: "Following years of regulatory back-and-forth, WhatsApp Payments has finally received full NPCI approval to offer UPI services to its entire Indian user base of 500 million people.",
    content: `<h2>The Giant Enters the Race</h2>
<p>WhatsApp has received approval from the National Payments Corporation of India to offer its UPI-based WhatsApp Payments feature to its entire Indian user base of approximately 500 million people, ending years of regulatory friction that had restricted the service to a limited user base since its initial launch in 2018. The full rollout begins on Monday with a phased scaling campaign.</p>
<p>WhatsApp Payments is built on the UPI interoperability framework, allowing users to send money to — and receive from — any other UPI ID regardless of which bank or payment app is used by the recipient. The feature is integrated directly into the WhatsApp chat interface, allowing P2P transfers within conversations.</p>
<h2>Why It Took This Long</h2>
<p>NPCI's previous restrictions were driven by two main concerns: competition fairness (keeping WhatsApp from using its dominant messaging position to immediately dominate payments) and data localisation compliance. WhatsApp has addressed the data requirement through an India-specific data processing architecture, and the NPCI's original "30% cap" on market share for any single UPI participant remains in place as a structural competition safeguard.</p>
<h2>Who Should Worry</h2>
<p>With 500 million potential users unlocked, PhonePe, Google Pay, and Paytm — which together hold over 90% of UPI transaction volume — will face competition from a platform that is already the primary daily communication app for hundreds of millions of Indians. Analysts expect WhatsApp to capture P2P payment flows first before challenging in the wider merchant payments market that PhonePe dominates.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-01T11:00:00Z"),
  },

  // ═══════════════════════ SPORTS ══════════════════════════════════════════

  {
    category: "sports",
    title: "India Win ICC Champions Trophy Final; Rohit Sharma Lifts the Trophy in Karachi",
    excerpt: "India claimed the 2026 ICC Champions Trophy with a six-wicket victory over New Zealand in an electric final at Karachi's National Stadium, Rohit Sharma's last tournament as ODI captain.",
    content: `<h2>Champions — and How</h2>
<p>India won the 2026 ICC Champions Trophy with a commanding six-wicket victory over New Zealand at the National Stadium, Karachi, before a capacity crowd of 34,000 in what was billed — and delivered — as one of the great days in Indian cricket. Chasing 271 from 50 overs, India reached their target with six balls to spare, with an unbeaten 89 from Shubman Gill and a Player of the Tournament performance from Jasprit Bumrah, who took 3/28 in the final, sealing the game.</p>
<p>For captain Rohit Sharma, raising the trophy marked a fitting full stop on a captaincy tenure that had also delivered the 2024 T20 World Cup title. He is expected to step down as ODI captain following negotiations with BCCI, passing the baton to a younger generation.</p>
<h2>The Final Table</h2>
<p>New Zealand batted first on a pitch that offered some early swing and were bowled out for 270, Daryl Mitchell top-scoring with 78 before Bumrah and Mohammed Shami (2/41) dismantled the lower order. India's chase was set on its winning course by an explosive 62-ball 64 from Virat Kohli before Gill and Hardik Pandya took India to the line in clinical fashion.</p>
<h2>India in Pakistan: The Bigger Story</h2>
<p>Beyond the cricket, the tournament — India's first series of matches in Pakistan since 2008 — carried enormous diplomatic and cultural weight. The presence of Indian fans travelling to Karachi and Lahore was described by commentators on both sides as "extraordinary" and "historic." Political observers wondered whether the sporting opening could translate into diplomatic momentum. For one week, at least, borders dissolved into scorecards.</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-05T18:00:00Z"),
  },
  {
    category: "sports",
    title: "Virat Kohli Announces Retirement from T20 Internationals After Champions Trophy Win",
    excerpt: "Hours after India's Champions Trophy victory, Virat Kohli announced on social media that he was retiring from T20 international cricket, following Rohit Sharma who made the same announcement at the post-match press conference.",
    content: `<h2>The End of an Era — Again</h2>
<p>Virat Kohli announced his retirement from T20 international cricket on Saturday evening, posting a long personal note on Instagram less than three hours after India's Champions Trophy final victory over New Zealand. The announcement came hours after a separate retirement post from captain Rohit Sharma, making Saturday one of the most bittersweet days in modern Indian cricket — a triumph bookended by the departures of two of the game's greatest players from its shortest format.</p>
<p>Kohli, 37, had already stepped back from T20 captaincy in 2021. His role in the format in recent years had been more selective, but his match-defining performances — including in the 2024 and 2026 tournament finals — had kept him at the centre of Indian cricket's global identity.</p>
<h2>The Numbers</h2>
<p>In T20 internationals, Kohli ends with 4,188 runs in 125 matches at an average of 52.3 and a strike rate of 139.2 — statistics that comfortably position him as the format's greatest run-scorer and among its most efficient operators despite a technique that was built for the longer format. His 38 fifties in the format are the most by any player.</p>
<h2>What Remains</h2>
<p>Kohli confirmed he would continue in Test cricket and indicated he was committed to playing the 2027 ODI World Cup in South Africa, giving Indian fans two more years of the chapter he has always considered his truest domain. "The red ball. That has always been the one," he wrote. "That love isn't going anywhere."</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T20:00:00Z"),
  },
  {
    category: "sports",
    title: "Neeraj Chopra Wins Back-to-Back World Athletics Championship Gold with 91.78m Throw",
    excerpt: "Neeraj Chopra defended his World Athletics Championships javelin title in Tokyo with an 91.78m throw, becoming the first Asian to win back-to-back golds in a field event at Worlds.",
    content: `<h2>History Written in Tokyo</h2>
<p>Neeraj Chopra etched his name deeper into athletics history on Friday, defending his World Athletics Championships javelin title in Tokyo with a personal best throw of 91.78 metres in the third round that proved unreachable for his rivals. The 27-year-old Haryana-born athlete became the first Asian male to win back-to-back gold medals in a throwing event at the World Athletics Championships, adding to an already extraordinary competitive record that includes Olympic gold (2020, 2024) and the previous World Championship title (2023).</p>
<p>The throw of 91.78m is also a new championship record, surpassing the mark set at the 2019 Doha Worlds. Germany's Julian Weber (88.92m) took silver, with Czech Republic's Jakub Vadlejch (87.89m) the bronze medallist.</p>
<h2>The Performance</h2>
<p>Chopra's winning throw came in the competition's third round after a cautious opening two that suggested he was struggling with the approach. His technique in the third round was described by athletics analysts as "close to perfect," combining the explosive torso rotation and blocking of the left side that generates the extraordinary velocity that characterises his best throws. "That third round was the performance of a champion under the most intense pressure," said Uwe Hohn, the former East German world record holder who serves as an informal technical advisor to Chopra.</p>
<h2>India's Athletic Moment</h2>
<p>The win prompted celebrations in athletic circles and far beyond. Prime Minister Modi tweeted congratulations and proposed a Bharat Ratna consideration for the champion. Sports analysts pointed to the contrast with India's historic medal drought in field events, noting that Chopra has single-handedly created a generation of aspiring javelin throwers in the country.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T19:00:00Z"),
  },
  {
    category: "sports",
    title: "IPL 2026 Opener: Mumbai Indians Beat Chennai Super Kings in Rain-Hit Thriller",
    excerpt: "The 19th season of the Indian Premier League opened in dramatic fashion as Mumbai Indians edged Chennai Super Kings by 8 runs via DLS method in a match interrupted by a sudden downpour at Wankhede.",
    content: `<h2>Cricket's Greatest Rivalry, Right on Schedule</h2>
<p>The Indian Premier League's 19th season began in its traditional fashion: the rivalry most cherished in the format, played at the ground that has witnessed some of its most dramatic moments. Mumbai Indians edged Chennai Super Kings by 8 runs on DLS method at Wankhede Stadium on Friday, in an opening game that had everything — a century, a superb bowling performance, a run out drama, and then a thunderstorm to send commentators scrambling for their Duckworth-Lewis calculators.</p>
<p>Mumbai Indians posted 196/6 in their 20 overs, anchored by a fluent 84 from South African import Rassie van der Dussen and a brutal 22-ball 47 from hard-hitting local product Tilak Varma. CSK's chase was going to plan at 108/3 from 13 overs when the heavens opened. The revised target was set at 145 from 17, which CSK reached at 136 — 9 short on DLS.</p>
<h2>Familiar Faces, New Chapters</h2>
<p>MS Dhoni was in the CSK lineup, as he has been in every edition since 2008, arriving to bat at number 7 and scoring an unbeaten 18 before the rain delay. The scene — Dhoni walking to the crease at Wankhede while the stadium rose — provoked the season's first waves of collective nostalgia. Whether this is his final season remains the question on every cricket fan's lips.</p>
<h2>The Long Season Ahead</h2>
<p>Seventy-four matches across 10 teams and 8 cities await fans over the next two months. The Rajasthan Royals, riding a core of Rs 25-crore retained player Yashasvi Jaiswal, are the bookmakers' favourites to claim the title that has eluded them since their inaugural win in 2008.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-03-28T20:00:00Z"),
  },
  {
    category: "sports",
    title: "India Women's Cricket Team Qualifies for T20 World Cup Final with Ten-Wicket Win",
    excerpt: "India Women demolished England in the semi-final with a dominant ten-wicket victory, setting up a final against Australia in a match that has captivated the entire country.",
    content: `<h2>Dominant. Dominant. Dominant.</h2>
<p>India Women's cricket team produced one of the most complete performances in Women's T20 World Cup history on Thursday, crushing England by ten wickets in the semi-final at Newlands, Cape Town, to book a place in their third consecutive T20 World Cup final. The result was stunning in its efficiency: England were bowled out for 103, and India knocked off the target in 9.2 overs without loss.</p>
<p>Deepti Sharma, the off-spinner who has become one of the most feared bowlers in women's cricket, took 4/8 in four overs of devastating accuracy. Spinners Sneh Rana (2/11) and Richa Ghosh (1/14 behind the stumps, with four catches) dismantled the English batting order with skill and athleticism that the broadcasting commentary described as "Test standard."</p>
<h2>The Final</h2>
<p>India face Australia in Saturday's final — a rematch of the 2020 final that Australia won by 85 runs in a game that still stings in Indian cricket circles. Captain Smriti Mandhana said her team had "unfinished business" against the Australians and was "more than ready." Harmanpreet Kaur, the veteran who made her debut in this event in 2010, confirmed she would play despite a finger injury recorded in the quarter-final.</p>
<h2>A Cultural Moment</h2>
<p>The India Women's team has transformed its profile in the country over the past four years, aided by BCCI investment in the Women's Premier League and significant broadcasting coverage. Saturday's final in Cape Town is expected to attract over 150 million television viewers in India, a figure that would rival any day of an India men's series.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-02T18:00:00Z"),
  },
  {
    category: "sports",
    title: "PV Sindhu Announces Retirement from Professional Badminton at Age 31",
    excerpt: "India's most decorated woman Olympic athlete, PV Sindhu, announced her retirement from professional badminton, ending a career that brought the country two Olympic medals and two World Championship gold medals.",
    content: `<h2>The Golden Career Comes to a Close</h2>
<p>PV Sindhu, India's most decorated female athlete and the only Indian woman to have won two consecutive Olympic medals, announced her retirement from professional badminton on Saturday in an emotional press conference in Hyderabad. The 31-year-old said the decision, made in conversation with her coach and family over several months, felt "right" and that she was "at peace with choosing this moment."</p>
<p>Sindhu's career arc — from a teenager training under Pullela Gopichand to the Rio 2016 silver medal, the Tokyo 2020 bronze, the 2019 and 2022 BWF World Championship gold medals, and a 12-year career at the top of the women's badminton world — is without precedent in Indian racquet sports history.</p>
<h2>The Career Numbers</h2>
<p>In 16 years as a senior international professional, Sindhu won 24 BWF Super Series/Super 1000 titles across six continents, amassed over $5.5 million in prize money, and reached a world ranking of number 1 (which she held for a combined 112 weeks). She was ranked number 3 at the time of retirement.</p>
<h2>What Comes Next</h2>
<p>Sindhu confirmed she would remain involved in Indian badminton through the PV Sindhu Academy she founded in Hyderabad, which currently trains over 2,000 young players. She also announced a collaboration with the Sports Authority of India on a National Badminton Talent Hunt programme targeting tier-2 and tier-3 city athletes. "My retirement from competition means my service to Indian badminton just changes form," she said.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T16:00:00Z"),
  },
  {
    category: "sports",
    title: "Wrestler Vinesh Phogat Wins Asian Wrestling Championship Gold After Dramatic Final",
    excerpt: "Vinesh Phogat made history at the Asian Wrestling Championships in Tashkent, winning gold in the 53kg category in a final that went to overtime, completing her comeback after the Paris controversy.",
    content: `<h2>Gold in Tashkent, Redemption in Spirit</h2>
<p>Vinesh Phogat won the gold medal in the 53kg freestyle category at the Asian Wrestling Championships in Tashkent, Uzbekistan, on Saturday, her first continental title since the 2019 Asian Championships and her most significant competitive achievement since the heartbreak of the Paris Olympics in 2024, where she was disqualified from the 50kg final after being found 100 grams over the weight limit.</p>
<p>The final against Uzbekistan's home favourite Gulnoza Matniyazova went to overtime, with Phogat clinching the decisive point in the final seconds of the extended period with a foot-sweep takedown that earned a roar from the Indian support in the Tashkent arena.</p>
<h2>The Comeback After Paris</h2>
<p>Phogat's road back from Paris — and from the simultaneously running legal battle with the Wrestling Federation of India in which she was among several athletes alleging harassment — has been arduous. She moved weight classes, changed coaches, and rebuilt her approach from the foundation up. Saturday's gold is seen as the clearest validation yet that the rebuild has succeeded.</p>
<p>"I am not just fighting for medals. I am fighting to show that what happened in Paris did not define me — what I do next does," she said through a translator at the post-match press conference.</p>
<h2>Olympic Qualification Implications</h2>
<p>The Asian Championship gold contributes significantly to Phogat's qualification ranking for the 2028 Los Angeles Olympics. She leads the Asia-Oceania ranking in the 53kg category and, barring significant reversal, is expected to be in the Indian squad for her fourth Olympic Games.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-05T14:00:00Z"),
  },
  {
    category: "sports",
    title: "Indian Football: Blue Tigers Move Up to FIFA Rank 95 After AFF Championship Win",
    excerpt: "India's national football team has climbed to FIFA rank 95 — the country's highest ranking in 30 years — following their ASEAN Football Federation Championship triumph in Kuala Lumpur.",
    content: `<h2>The Blue Tigers Are Roaring</h2>
<p>India's national football team has climbed to FIFA rank 95 in the monthly update, the highest position the country has held since the early 1990s when India's football was at its peak of domestic talent. The improvement is the direct result of India winning the 2026 ASEAN Football Federation Championship in Kuala Lumpur, beating Vietnam 1-0 in a tightly-contested final through a Sunil Chhetri-inspired performance that belied the veteran striker's 41 years.</p>
<p>The win establishes India as the dominant team in South and Southeast Asian football and sets the stage for what the All India Football Federation describes as an assault on the 2027 AFC Asian Cup qualification, where India has historically fallen short despite improving standards.</p>
<h2>The Academy Revolution</h2>
<p>India's improvement in football has been painstaking and attributable in significant part to the academies established by ISL clubs over the past decade. The current national team has a majority of players who came through club academy systems — a stark change from a decade ago when the national team drew heavily from state associations and the Services FA, which had fewer professional development resources.</p>
<h2>Chhetri: The Unending Story</h2>
<p>Sunil Chhetri, who featured as a second-half substitute in the final and provided the assist for India's winning goal, continues to defy expectations of retirement. At 41, he has overtaken Cristiano Ronaldo for the most international goals by a captain in Asian football history. "I will play as long as I can contribute," he said simply. No one who watched the final doubted him.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-01T10:00:00Z"),
  },

  // ═══════════════════════ WORLD (India international) ════════════════════

  {
    category: "world",
    title: "India-China Agree on Three New Disengagement Points Along LAC in Latest Corps Commander Talks",
    excerpt: "India and China have agreed on the disengagement of forward military positions at three additional friction points along the Line of Actual Control, marking the most significant border progress since 2020.",
    content: `<h2>Quiet Diplomacy Yields Results</h2>
<p>India and China have reached an agreement to disengage forces from three additional friction points along the Line of Actual Control in eastern Ladakh, according to an official statement released jointly by India's Ministry of External Affairs and China's Ministry of Foreign Affairs. The agreement was reached during the 23rd round of Corps Commander-level talks held at the Chushul-Moldo border meeting point on Friday.</p>
<p>The three points — in the Demchok, Depsang Plains, and the Daulat Beg Oldie sectors — are among the most sensitive of the standoff areas that emerged from the June 2020 Galwan confrontation that killed 20 Indian soldiers and at least four Chinese People's Liberation Army personnel. The Depsang disengagement is the most symbolically significant, as that sector involves a strategically important plateau that Indian military planners consider of particular critical value.</p>
<h2>What Disengagement Means</h2>
<p>The disengagement process involves both sides pulling back forward-deployed troops to agreed holding positions, dismantling temporary forward structures, and restoring traditional patrolling patterns that were disrupted in 2020. The process will be monitored through a mutual verification mechanism involving ground checks and shared satellite imagery.</p>
<h2>The Broader Context</h2>
<p>The agreement follows last year's resumption of direct flights between Delhi and Beijing, the reopening of the Kailash Mansarovar Yatra route, and PM Modi and President Xi's bilateral on the margins of the 2025 BRICS summit. Analysts cautioned that previous agreements had produced limited implementation and that sustained verification would be essential to determine whether this round of talks produces lasting progress.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T06:00:00Z"),
  },
  {
    category: "world",
    title: "PM Modi's Saudi Visit Yields $100 Billion Oil Deal and India-Gulf Investment Pact",
    excerpt: "Prime Minister Modi's two-day state visit to Riyadh has concluded with a comprehensive energy partnership and the largest bilateral investment commitment India has received from any Gulf state.",
    content: `<h2>A Strategic Deepening</h2>
<p>Prime Minister Narendra Modi concluded a two-day state visit to Saudi Arabia with a comprehensive package of bilateral agreements that includes a long-term oil supply framework covering 1.5 million barrels per day and a $100 billion investment commitment from Saudi Arabia's Public Investment Fund across Indian infrastructure, manufacturing, and technology sectors over five years. The visit, Modi's fourth as Prime Minister to the Kingdom, signals the continued deepening of a strategic relationship built over the past decade.</p>
<p>The oil supply framework, to run for 10 years with annual review provisions, provides India with pricing certainty amid global market volatility. India is Saudi Arabia's second-largest oil customer after China, and the bilateral energy relationship underpins the broader strategic and people-to-people ties between the two countries.</p>
<h2>PIF's India Investment</h2>
<p>The PIF's $100 billion india commitment — which includes both greenfield and partnership investments — covers the National Infrastructure Pipeline, renewable energy (particularly solar), housing, and a significant technology component including a cloud infrastructure co-investment with an Indian hyperscaler. "India's growth trajectory makes it the most compelling investment opportunity in the world for any long-term investor," said Saudi Investment Minister Khalid al-Falih.</p>
<h2>The Diaspora Factor</h2>
<p>Over 2.7 million Indians live and work in Saudi Arabia, the largest diaspora community in the Kingdom. PM Modi's visit included a community event attended by 30,000 Indian nationals, at which the Prime Minister announced several consular service improvements including a faster digital visa application process and expanded health insurance cooperation for Indian workers.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-02T14:00:00Z"),
  },
  {
    category: "world",
    title: "India-US 2+2 Dialogue: New Agreement on AI, Drone, and Space Technology Transfer",
    excerpt: "The annual India-US 2+2 Ministerial Dialogue in Washington produced a new bilateral technology transfer framework covering AI military applications, drone co-production, and joint space situational awareness.",
    content: `<h2>The Partnership Deepens</h2>
<p>The annual India-US 2+2 Ministerial Dialogue — the joint meeting of the two countries' Foreign and Defence Ministers — held in Washington produced a new defence technology transfer framework that officials from both sides described as a "qualitative step change" in the bilateral relationship. The framework covers three main areas: AI-enabled defence applications, co-production of specific armed and surveillance drone systems, and a joint space situational awareness sharing arrangement.</p>
<p>The AI agreement — classified in portions but with an unclassified summary — establishes a joint working group to develop AI-enabled logistics optimisation, autonomous surveillance, and cybersecurity applications, with an agreed IP-sharing structure that gives India co-ownership of applications developed within the bilateral programme.</p>
<h2>Drone Co-Production</h2>
<p>The drone co-production arrangement covers two US-designed systems: a medium-altitude long-endurance ISR drone and a loitering munitions system. Indian companies including HAL, DRDO, and two private sector defence manufacturers will be integrated as co-producers, building in an offset structure that develops Indian manufacturing capability alongside US technology transfer. Delivery of initial systems is expected by 2029.</p>
<h2>QUAD and Indo-Pacific</h2>
<p>The dialogue also covered the Indo-Pacific regional security architecture, with both sides reaffirming commitment to the QUAD framework and to freedom of navigation in the South China Sea. The joint statement made an unusually direct reference to the need for rules-based order in "the East and South China Seas," language that strategic observers noted as more pointed than recent bilateral communiqués.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-03T16:00:00Z"),
  },
  {
    category: "world",
    title: "India Sends Largest-Ever Peacekeeping Contingent to UN Mission in DRC",
    excerpt: "India has deployed 3,200 additional troops to MONUSCO in the Democratic Republic of Congo, its largest single peacekeeping deployment in two decades, as violence escalates in the eastern regions.",
    content: `<h2>India's Peacekeeping Commitment</h2>
<p>India has deployed its largest peacekeeping contingent in twenty years, sending 3,200 additional Army and CRPF personnel to the United Nations Organization Stabilization Mission in the Democratic Republic of the Congo (MONUSCO) as the security situation in eastern DRC deteriorates following the advance of the M23 rebel movement and its Rwandan backers.</p>
<p>India is the third-largest contributor to UN peacekeeping operations globally, with over 6,000 personnel currently deployed across twelve UN missions. The DRC deployment brings India's MONUSCO contingent to over 5,500, the mission's largest national contribution. Indian peacekeepers are deployed primarily in the Kivu provinces and around the strategic city of Goma.</p>
<h2>Mission Conditions and Casualty Risk</h2>
<p>MONUSCO has faced some of the most challenging conditions in the UN peacekeeping system. Over 250 peacekeepers have been killed in the mission since its establishment in 1999. Indian soldiers have served with distinction but also suffered casualties, most recently in 2024 when a patrol in North Kivu was ambushed, killing two Indian paratroopers.</p>
<p>The expanded deployment has been cleared by India's Parliamentary Standing Committee on Defence, which noted the mission's mandate, rules of engagement, and India's historical involvement in DRC peace operations since the 1990s.</p>
<h2>India's UN Ambitions</h2>
<p>New Delhi's sustained commitment to UN peacekeeping is deeply connected to its campaign for a permanent seat on the UN Security Council. Official statements have consistently linked peacekeeping contribution to India's argument that it deserves a more permanent voice in multilateral security governance.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-01T08:00:00Z"),
  },
  {
    category: "world",
    title: "Indian Diaspora Remittances Cross $160 Billion in FY26: A New World Record",
    excerpt: "World Bank data confirms that Indian nationals abroad sent home $160.7 billion in FY2025-26, the highest remittance figure ever recorded for any single country in history.",
    content: `<h2>The World's Largest Remittance Flow</h2>
<p>India received a record $160.7 billion in remittances in fiscal year 2025-26, according to preliminary data published by the World Bank's Migration and Development Brief. The figure surpasses India's own previous record of $125 billion in FY24-25 and is the highest remittance inflow ever recorded for any country in a single year — equivalent to approximately 3.8% of India's GDP.</p>
<p>The surge is attributable to multiple factors: a growing Indian professional diaspora in the United States, Canada, and Australia (benefiting from technology and healthcare demand); a large and established community of workers in the Gulf states (whose remittances tick upward with oil-economy prosperity); and improved remittance channel efficiency driven by UPI's international expansion and fintech competition that has reduced transfer costs significantly.</p>
<h2>Gulf: The Foundation</h2>
<p>The Gulf Cooperation Council countries — UAE, Saudi Arabia, Kuwait, Qatar, Oman, and Bahrain — together account for approximately 35% of total inflows, with the UAE alone contributing almost $28 billion. The GCC's share has been declining proportionally as the US and UK become more significant sources of high-value remittances from professional workers.</p>
<h2>Economic Significance</h2>
<p>The remittance flow exceeds India's total FDI inflows and provides a significant support to the current account balance. For many states — particularly Kerala, Goa, and parts of UP and Bihar — remittances are a fundamental pillar of household income, local real estate markets, and educational investment. The flow also provides indirect fiscal support through consumption and the multiplier effect in receiving communities.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-02T10:00:00Z"),
  },
  {
    category: "world",
    title: "India-Africa Summit: 54 Nations Convene in Delhi for Largest Africa Engagement in History",
    excerpt: "The India-Africa Forum Summit in New Delhi brought leaders from all 54 African nations to discuss a new partnership framework worth $100 billion over ten years.",
    content: `<h2>Africa and India: A New Chapter</h2>
<p>New Delhi hosted the fourth India-Africa Forum Summit this week, with delegations from all 54 African nations attending what the government billed as India's most ambitious multilateral engagement outside the United Nations. Prime Minister Modi announced a ten-year India-Africa Partnership Framework committing $100 billion in lines of credit, grant aid, and private sector investment across six priority sectors: infrastructure, digital connectivity, health, agriculture, education, and clean energy.</p>
<p>The summit's theme — "Shared Future: People, Planet, Prosperity" — echoed the language of the Global South solidarity that has become a central pillar of India's foreign policy positioning. PM Modi's address drew applause for its explicit rejection of what he called "neo-colonial development finance" and his commitment to "partnerships of equals."</p>
<h2>The Competition with China</h2>
<p>India's deepening Africa engagement is explicitly positioned as a counterweight to Chinese influence on the continent. China has invested over $300 billion in African infrastructure since 2000 through the Belt and Road Initiative, and its contractors have built railways, ports, and power plants across the continent. India's approach emphasises grant aid over loans, technical assistance over physical infrastructure, and human capital development through scholarships and training over hardware deployment.</p>
<h2>African Voices</h2>
<p>African leaders at the summit were candid about wanting genuine partnership rather than a competition proxy for Indian and Chinese interests. "We are not choosing between India and China," said one East African head of government in a closed session. "We want what is best for our people. Both partners need to understand that." The statement was well-received by the Indian side, which has increasingly emphasised that its Africa policy is not purely about geopolitical competition.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-03-30T10:00:00Z"),
  },

  // ═══════════════════════ CULTURE / ENTERTAINMENT ══════════════════════

  {
    category: "entertainment",
    title: "Aamir Khan's 'Mahabharata' Becomes Highest-Grossing Indian Film of All Time at Rs 3,200 Crore",
    excerpt: "The first part of Aamir Khan's long-awaited Mahabharata adaptation has crossed Rs 3,200 crore worldwide, surpassing Baahubali 2 to become the highest-grossing Indian film in history.",
    content: `<h2>A Cinematic Event Like No Other</h2>
<p>Aamir Khan's Mahabharata — Part One: The Kuru Kingdom, released on Holi weekend after nine years in production, has passed Rs 3,200 crore in worldwide box office collections in just three weeks, surpassing Baahubali 2: The Conclusion's Rs 2,900 crore to become the highest-grossing Indian film of all time. The internationally released English version, titled 'Mahabharata: The Rise of the Kurus', added an additional $180 million from non-South-Asian global markets.</p>
<p>The film, which spans over three hours, covers the Adi and Sabha Parvas of the original epic — from the birth of the Kaurava and Pandava princes to the dice game that sets the Mahabharata's central conflict in motion. Khan, who spent seven years in a co-writer capacity before beginning production, also plays the role of Karna. The ensemble cast of 142 includes virtually every major Indian star across languages.</p>
<h2>The Production</h2>
<p>Made on a budget of Rs 1,200 crore — the most expensive Indian film ever produced — employing over 12,000 technicians, costume designers, set builders, and VFX artists across five studios in Mumbai, Hyderabad, and Chennai, and shot across 12 location countries including Turkey, Jordan, and the forests of North Sikkim. The scale of the production has been compared in scope and ambition to Peter Jackson's Lord of the Rings trilogy.</p>
<h2>Parts Two and Three</h2>
<p>Khan confirmed at a press event that Part Two — covering the forest exile and events leading to Kurukshetra — is in the cutting room, with a target release in Diwali 2027. Part Three, the war and aftermath, is expected in 2028 or 2029. "This is the story my civilisation has been telling for three thousand years," Khan said. "I intend to honour it."</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-04T20:00:00Z"),
  },
  {
    category: "entertainment",
    title: "Jaipur Literature Festival 2026 Announces Lineup: Salman Rushdie, Arundhati Roy, and 250 More",
    excerpt: "The world's largest free literary gathering has announced its 2026 lineup, headlined by Salman Rushdie and Arundhati Roy in what will be their first joint public appearance in over a decade.",
    content: `<h2>The World's Greatest Literary Party</h2>
<p>The Jaipur Literature Festival has announced its speaker and writer lineup for the 2027 winter edition, headlined by two of the most celebrated — and controversial — names in contemporary Indian literature: Salman Rushdie and Arundhati Roy. The announcement confirms what has been rumoured in literary circles: the two authors, who have not appeared on a shared public platform since a charged 2011 exchange in London, will participate in a conversation that the festival has diplomatically titled "The Novel and Its Obligations."</p>
<p>The full lineup of 258 participants across five days includes 84 international authors, 130 Indian authors in multiple languages, 22 journalists and non-fiction writers, and 22 visual artists, musicians, and filmmakers participating in interdisciplinary events. The festival will be held for the first time in its new permanent home at the expanded Statue Circle cultural complex in Jaipur, offering an increased event capacity of 35,000 attendees per day.</p>
<h2>The India Languages Focus</h2>
<p>This year's festival has made a particular commitment to Indian language literature, with dedicated programming in Tamil, Kannada, Bengali, Marathi, Gujarati, Urdu, and Punjabi. Ten Indian-language authors have been selected for the festival's first international translation commission, which will fund translations of their work into English, French, German, Spanish, and three East Asian languages.</p>
<h2>The Opening and Closing</h2>
<p>The festival opens with a keynote by the new Nobel Laureate in Literature — announced by the Swedish Academy in October — and closes with a gala event celebrating the centenary of the publication of RK Narayan's 'Swami and Friends', considered the foundational text of Indian fiction in English.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-03T13:00:00Z"),
  },
  {
    category: "entertainment",
    title: "AR Rahman Wins Grammy for Best World Music Album; Dedicates Award to Tamil Classical Tradition",
    excerpt: "AR Rahman became the first Indian to win the Grammy for Best World Music Album since Ravi Shankar, dedicating the honour to Tamil classical music and the composers who shaped his musical education.",
    content: `<h2>The Mozart of Madras Adds Another Gold</h2>
<p>AR Rahman added a third Grammy Award to his mantelpiece at Sunday's ceremony in Los Angeles, winning the Best World Music Album award for his album 'Kaveri: A River's Memory', a sprawling two-disc set that weaves together Tamil classical Carnatic structures, contemporary electronica, and field recordings made along the length of the Kaveri river. It is Rahman's first solo album in five years and widely considered his most personal and musically ambitious work.</p>
<p>In his acceptance speech, delivered partly in Tamil, Rahman dedicated the award to the tradition of Tamil classical music and to his early teachers, crediting his training under Carnatic maestros in Chennai as the foundation on which everything in his career was built. "I am a student of this tradition. Whatever I have achieved is a reflection of what my teachers gave me," he said.</p>
<h2>The Album</h2>
<p>'Kaveri: A River's Memory' was recorded over three years and includes collaborations with 47 musicians spanning four generations of Carnatic and Hindustani musicians, contemporary jazz artists, electronic producers, and environmental sound artists. The album was accompanied by a documentary — directed by Mira Nair — on the Kaveri river's ecological and cultural significance, released on a global streaming platform to coincide with the album launch.</p>
<h2>India Reacts</h2>
<p>Social media in India responded to the Grammy with an outpouring that crossed all lines of state, language, and generation. Prime Minister Modi called Rahman "a national treasure." Tamil Nadu CM tweeted in Tamil, congratulating the state's most celebrated living son. Cross-cultural celebrations in Chennai, Delhi, and Mumbai ran through Sunday night.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-01T07:00:00Z"),
  },
  {
    category: "entertainment",
    title: "India's OTT Boom: Streaming Revenue Crosses $5 Billion, Surpassing Box Office for First Time",
    excerpt: "India's total streaming revenue has for the first time surpassed theatrical box office collections, reflecting a fundamental shift in how Indians consume entertainment, accelerated by premium tier launches and original content investment.",
    content: `<h2>The Year Streaming Conquered India</h2>
<p>Total streaming revenue in India crossed Rs 42,000 crore ($5.1 billion) in fiscal year 2025-26, surpassing the theatrical box office — which generated Rs 37,500 crore — for the first time, according to data from the Ficci-EY India Entertainment Report released Friday. The crossing of this threshold is seen by industry analysts as a structural inflection point in Indian entertainment comparable to the shift from terrestrial to cable television in the 1990s.</p>
<p>Netflix, Amazon Prime Video, JioCinema, Disney+Hotstar, and Sony LIV together hold approximately 80% of the streaming market, while a new generation of regional-language platforms — particularly for Tamil, Telugu, Malayalam, and Kannada content — are growing at over 50% annually from a smaller base.</p>
<h2>Why Now</h2>
<p>Several factors converged to produce this year's tip. The launch of Netflix and Amazon's new mid-tier subscription options at Rs 149 per month dramatically expanded the paid subscriber pool. JioCinema's conversion of its free sports streaming audience to paid subscribers — deploying IPL cricket as the anchor — added tens of millions. And an explosion in co-produced Indian original content, now routinely budgeted at Rs 30-100 crore per season, has given consumers genuine premium alternatives to theatrical film.</p>
<h2>Theatrical's Response</h2>
<p>The theatrical exhibition industry is not ceding ground without resistance. Multiplex operators have invested heavily in IMAX and premium large format screens, experiential dining, and the spectacle of big-budget event films that cannot be replicated at home. "No one watches Mahabharata on a phone," said one multiplex CEO. "For certain films, cinema is irreplaceable." The box office data bears this out: premium formats now account for 38% of multiplex revenue despite representing a fraction of screens.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-02T16:00:00Z"),
  },
  {
    category: "entertainment",
    title: "Kashi Vishwanath Corridor Phase 2 Inaugurated; PM Modi Leads Prayers at New Ghats",
    excerpt: "Prime Minister Modi inaugurated the second phase of the Kashi Vishwanath Corridor development in Varanasi, which adds 12 new ghats, an Ayurveda wellness centre, and a museum of Kashi's cultural heritage.",
    content: `<h2>The Holy City Transforms</h2>
<p>The second phase of the Kashi Vishwanath Corridor project was inaugurated by Prime Minister Narendra Modi in Varanasi on Saturday in a ceremony that drew over 200,000 pilgrims and was broadcast live across India's major television networks. The Phase 2 development adds 12 new ghats along the Ganga riverfront, a museum dedicated to Kashi's 5,000 years of cultural and religious heritage, and an Ayurveda wellness centre designed by a National Institute of Design team led by a Varanasi architect.</p>
<p>The overall Kashi Vishwanath Corridor project, which began with Phase 1's inauguration in December 2021, has transformed the area around the Vishwanath temple from a dense, labyrinthine neighbourhood into an open pilgrimage precinct visible from the Ganga ghats. The project required the relocation of approximately 300 families and has been the subject of both celebration and criticism.</p>
<h2>Numbers and Scale</h2>
<p>The Phase 1 corridor has received more than 100 million visitors since its opening — a figure that exceeds the annual pilgrim count to many of the world's most significant religious sites. Tourism revenue in Varanasi has tripled since 2021. The Uttar Pradesh government has described the project as the most significant cultural heritage development in India since independence.</p>
<h2>Criticism and Response</h2>
<p>Critics, including several conservation architects and Varanasi residents, have argued that the demolition of historic structures for the corridor has irrevocably damaged the organic historic urban fabric that gave the city its authenticity. "What has been gained in access has been lost in soul," wrote one conservation architect in a widely shared letter. The government's response has pointed to the millions of pilgrims now able to reach the temple in dignity as its own answer.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-03T06:00:00Z"),
  },
  {
    category: "entertainment",
    title: "India's Classical Dance Prodigy Wins Benois de la Danse at 22, First Indian in History",
    excerpt: "Srinidhi Chidambaram, a 22-year-old Bharatanatyam and contemporary fusion dancer from Chennai, has become the first Indian to win the Benois de la Danse — the Oscar of the dance world.",
    content: `<h2>A Historic Win for Indian Classical Dance</h2>
<p>Srinidhi Chidambaram, a 22-year-old dancer from Chennai who trained in Bharatanatyam from the age of four before weaving in contemporary and flamenco influences, has been awarded the Benois de la Danse at the ceremony held at the Bolshoi Theatre in Moscow, becoming the first Indian and the first practitioner of any South Asian dance form to win the award since its establishment in 1991.</p>
<p>The award jury cited "extraordinary technical mastery, conceptual originality, and the extraordinary communication of a performance that spoke across all cultural boundaries" in presenting the award to Chidambaram for her solo work 'Ardhanarishvara: The Half-God', a 70-minute piece exploring the Shaivite concept of the divine as simultaneously masculine and feminine.</p>
<h2>Who Is Srinidhi?</h2>
<p>Srinidhi began training under Guru Alarmel Valli in Chennai, studied flamenco at the Amor de Dios studio in Madrid on a cultural exchange fellowship, and developed her fusion methodology under choreographic guidance from Akram Khan, the British-Bangladeshi contemporary dance legend whose crossing of Kathak and contemporary idioms is the closest antecedent to what Srinidhi is doing with Bharatanatyam.</p>
<p>Her work has been performed at the Edinburgh International Festival, at the Sydney Opera House, and before the Dalai Lama in Dharamsala, but Saturday's Bolshoi recognition marks a step change in her global profile.</p>
<h2>India's Cultural Diplomacy Moment</h2>
<p>The win has been welcomed by the Ministry of Culture as evidence that Indian classical traditions have global claim to the highest artistic recognition. Several established Bharatanatyam schools have already reached out to Srinidhi for collaborations, recognising that her international profile provides a rare platform to introduce the form to global audiences.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-02T20:00:00Z"),
  },

  // ═══════════════════════ SCIENCE ══════════════════════════════════════

  {
    category: "science",
    title: "Chandrayaan-4 Successfully Launched; Mission to Bring Moon Samples Back to Earth",
    excerpt: "India launched Chandrayaan-4 on a GSLV Mk III rocket in a flawless ascent, beginning a complex multi-stage mission to collect and return the first lunar soil samples in Indian space history.",
    content: `<h2>India's Most Complex Space Mission Begins</h2>
<p>The Indian Space Research Organisation's Chandrayaan-4 mission lifted off flawlessly from the Satish Dhawan Space Centre at Sriharikota on Saturday morning aboard a GSLV Mark III (LVM3) launch vehicle, beginning what will be India's most technically complex space mission: a lunar sample return mission designed to collect 2-3 kg of regolith from the Moon's south pole and transport it back to Earth.</p>
<p>The mission involves four distinct spacecraft modules — an ascender, a descender, a transfer module, and a re-entry module — in a configuration that requires orbital rendezvous and docking in lunar orbit, a manoeuvre that India has never previously attempted. ISRO has developed a new autonomous docking system — called the Space Docking Experiment (SPADEX) heritage system, scaled up from the December 2024 SPADEX demonstration — for the critical orbital assembly phase.</p>
<h2>Why Sample Return Matters</h2>
<p>Lunar sample return missions — achieved previously by the United States (Apollo programme), the Soviet Union (Luna programme), China (Chang'e 5 and 6), and Japan-authored JAXA contributions — provide irreplaceable scientific data. Physical lunar material can be tested in Earth laboratories with instruments of arbitrary sophistication, yielding information about the Moon's composition, age, and exposure history that no remote sensor can provide. ISRO scientists are particularly interested in samples from the permanently shadowed regions at the south pole where water ice has been confirmed by India's own Chandrayaan-1 mission.</p>
<h2>Timeline</h2>
<p>Chandrayaan-4 will reach lunar orbit in approximately five days, enter a stable polar orbit, and conduct a surveying phase before the descender separates and lands near the Malapert Massif. Sample collection and ascender launch are targeted for six weeks post-launch. The Earth return window is expected in late May 2026.</p>`,
    isFeatured: true,
    publishedAt: new Date("2026-04-05T03:00:00Z"),
  },
  {
    category: "science",
    title: "IIT Bombay Researchers Develop Cancer Treatment Using Gold Nanoparticles; Phase 2 Trial Approved",
    excerpt: "A research team at IIT Bombay has received CDSCO approval for a Phase 2 clinical trial of a gold nanoparticle-mediated targeted cancer therapy that showed 87% tumour suppression in Phase 1B.",
    content: `<h2>Nanotechnology Meets Oncology in Mumbai</h2>
<p>Researchers at the Indian Institute of Technology Bombay's Centre for Excellence in Nanoscience have received approval from the Central Drugs Standard Control Organisation for a Phase 2 clinical trial of a novel cancer therapy using functionalised gold nanoparticles. The treatment — developed over eight years by a team led by Professor Rohini Bhavsar in collaboration with Tata Memorial Hospital — uses gold nanoparticles programmed to seek out and accumulate in solid tumour tissue, where they are then activated by near-infrared laser irradiation to destroy tumour cells through photothermal heating.</p>
<p>The Phase 1B trial, conducted at Tata Memorial Centre with 42 patients diagnosed with locally advanced head and neck cancers refractory to standard chemotherapy, showed tumour volume reduction of 87% in the treated group, with a complete response in 23% of patients three months post-treatment. Side effects were localised, avoiding the systemic toxicity that characterises standard chemotherapy regimens.</p>
<h2>The Science</h2>
<p>The nanoparticles — designed and synthesised in IITB's nanofabrication facility — are surface-coated with antibodies that bind specifically to the epidermal growth factor receptor (EGFR) overexpressed in head and neck cancers. This targeting mechanism concentrates the nanoparticles preferentially in tumour tissue rather than healthy tissue, addressing the fundamental pharmacological challenge of cancer therapy: how to kill cancer cells selectively without damaging the surrounding healthy tissue.</p>
<h2>Phase 2 Design and Timeline</h2>
<p>The Phase 2 trial will enrol 180 patients across Tata Memorial Centre, AIIMS Delhi, and three regional cancer institutes. Primary endpoint is overall survival at 12 months compared to standard second-line chemotherapy. Results are expected in late 2027, with potential regulatory approval by 2029 if the trial meets its endpoint.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-04T11:00:00Z"),
  },
  {
    category: "science",
    title: "AIIMS Develops Rs 50 Dengue Rapid Test; WHO Fast-Tracks Review for Global Deployment",
    excerpt: "A research collaboration led by AIIMS New Delhi has produced a dengue fever rapid diagnostic test that costs less than Rs 50 to manufacture and delivers results in 15 minutes, prompting WHO to expedite its review.",
    content: `<h2>Fighting Dengue at Scale</h2>
<p>A rapid diagnostic test for dengue fever developed by a research collaboration led by the All India Institute of Medical Sciences Delhi has prompted the World Health Organisation to initiate fast-track review for potential listing on the WHO Prequalification List for use in low-and-middle-income countries. The test, which uses a novel paper-based microfluidic strip technology developed in partnership with CSIR's Institute of Genomics and Integrative Biology, can be manufactured at under Rs 50 (approximately 60 US cents) per test and returns a result within 15 minutes from a single drop of blood.</p>
<p>The test simultaneously detects NS1 antigen — which is positive in the first week of illness — and IgM and IgG antibodies, giving clinicians the same diagnostic information currently available only from combined tests that cost Rs 800-2,000 in Indian hospitals and Rs 3-5 in international markets.</p>
<h2>Why This Matters for India</h2>
<p>India reports approximately 200,000 confirmed dengue cases annually with significant underreporting, particularly in rural areas where the cost of testing discourages healthcare-seeking behaviour. The ability to test at point-of-care in primary health centres at Rs 50 per test could transform dengue surveillance and management in the country's most affected states, particularly Uttar Pradesh, Tamil Nadu, Telangana, and Kerala.</p>
<h2>Global Potential</h2>
<p>The WHO's expedited review reflects the test's global potential. Dengue affects over 400 million people in tropical countries annually, with fewer than 25% of cases currently confirmed by diagnostic testing. The Gates Foundation has provided bridge funding to accelerate manufacturing scale-up while the prequalification review proceeds, with the target of making the test available at below $1 per unit globally by 2027.</p>`,
    isFeatured: false,
    publishedAt: new Date("2026-04-01T14:00:00Z"),
  },
];

async function main() {
  console.log("🇮🇳  Starting India articles seed...\n");

  // ── Extra categories ────────────────────────────────────────────────────────
  const categoryMap: Record<string, string> = {};

  // Load existing categories first
  const existingCategories = await prisma.category.findMany();
  for (const cat of existingCategories) {
    categoryMap[cat.slug] = cat.id;
  }

  // Upsert new categories
  for (const cat of NEW_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap[cat.slug] = created.id;
    console.log(`✅ Category: ${cat.name}`);
  }

  // ── Find admin user ─────────────────────────────────────────────────────────
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    throw new Error("No admin user found. Run prisma/seed.ts first.");
  }

  // ── Articles ────────────────────────────────────────────────────────────────
  let created = 0;
  let skipped = 0;

  for (const article of INDIA_ARTICLES) {
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);

    const catId = categoryMap[article.category];
    if (!catId) {
      console.warn(`⚠️  Category "${article.category}" not found — skipping "${article.title.slice(0, 50)}"`);
      skipped++;
      continue;
    }

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
        categoryId: catId,
      },
    });

    console.log(`✅ ${article.category.padEnd(15)} ${article.title.slice(0, 65)}`);
    created++;
  }

  console.log(`\n🎉 Done! ${created} articles added, ${skipped} skipped.`);
  console.log("─────────────────────────────────────────");
  console.log("New categories added: Business, Entertainment, India");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
