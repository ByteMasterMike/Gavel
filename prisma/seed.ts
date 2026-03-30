/**
 * Synthetic teaching scenarios for MVP play-testing — not scraped from CourtListener,
 * Harvard CAP, or any live docket. Facts/names are fictionalized composites.
 */
import { PrismaClient, CaseKind } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.dailyChallenge.deleteMany();
  await prisma.userRuling.deleteMany();
  await prisma.caseDocument.deleteMany();
  await prisma.precedent.deleteMany();
  await prisma.case.deleteMany();

  const tier1 = await prisma.case.create({
    data: {
      title: "People v. Chen — Speeding Infraction",
      tier: 1,
      kind: CaseKind.CRIMINAL,
      category: "Traffic / Infractions",
      briefSummary:
        "Defendant is cited for exceeding a posted 35 mph limit on Maple Ave (alleged 52 mph). The officer used a calibrated LIDAR unit. Defendant claims mistaken identity of vehicle and challenges the reading due to weather. No injuries; infraction only.",
      parTimeMinutes: 8,
      correctVerdict: "GUILTY",
      correctSentenceText: "$150 fine plus $40 court costs; traffic school optional.",
      correctSentenceNumeric: 150,
      correctReasoningSummary:
        "Calibration certificate was timely; officer testimony is credible and consistent with LIDAR capture. Defendant's mistaken-identity theory is speculative and unsupported by any competing speed measurement.",
      actualOpinionExcerpt:
        "The Court finds the defendant GUILTY of the infraction. Judgment: $150 fine, $40 court costs, and optional traffic school upon timely application.",
      isOverturned: false,
      whyExplanation:
        "Speed infractions often turn on device calibration logs and officer training. Weak identity defenses rarely overcome a clear LIDAR lock paired with a visual estimate.",
      maxPrecedents: 3,
      documents: {
        create: [
          {
            title: "Citation & LIDAR Calibration Log",
            sortOrder: 0,
            isAdmissible: true,
            isMaterial: true,
            content:
              "Citation #T-8831. LIDAR serial L-204, calibration checked before/after shift per agency policy. Reading: 52 mph in a 35 mph zone. Weather: clear. Distance: approx. 400 feet.",
          },
          {
            title: "Defendant Written Statement",
            sortOrder: 1,
            isAdmissible: true,
            isMaterial: true,
            content:
              "I believe the officer clocked a different silver sedan. I was not speeding. I had my cruise set to 35. No passengers; no dashcam.",
          },
        ],
      },
      precedents: {
        create: [
          {
            name: "People v. Maguire",
            citation: "130 Cal. App. 4th 1094 (2005)",
            sortOrder: 0,
            isRelevant: true,
            weightMultiplier: 2.2,
            summary:
              "LIDAR results are admissible when the device is properly calibrated and the operator is qualified; foundational requirements are routine for infraction trials.",
          },
          {
            name: "State v. Anderson — Speed Measurement",
            citation: "92 P.3d 221 (Wash. App. 2004)",
            sortOrder: 1,
            isRelevant: true,
            weightMultiplier: 1.6,
            summary:
              "A defendant's bare denial without affirmative evidence rarely creates reasonable doubt against a properly documented speed reading.",
          },
          {
            name: "Miranda v. Arizona",
            citation: "384 U.S. 436 (1966)",
            sortOrder: 2,
            isRelevant: false,
            weightMultiplier: 1,
            summary:
              "Custodial interrogation warnings in criminal investigations — not controlling for traffic infraction bench trials on speed evidence.",
          },
        ],
      },
    },
  });

  const tier2 = await prisma.case.create({
    data: {
      title: "State v. Alvarez — Retail Theft (Misdemeanor)",
      tier: 2,
      kind: CaseKind.CRIMINAL,
      category: "Criminal Law",
      briefSummary:
        "Defendant is charged with misdemeanor shoplifting ($38 in merchandise) from a chain pharmacy. Loss prevention detained defendant outside the store. Defendant claims they forgot to pay after a phone call distracted them. The State seeks a modest sentence emphasizing deterrence and restitution.",
      parTimeMinutes: 12,
      correctVerdict: "GUILTY",
      correctSentenceText: "Guilty; 6 months supervised probation; $200 restitution; theft-awareness course.",
      correctSentenceNumeric: 200,
      correctReasoningSummary:
        "Surveillance and witness testimony establish intent to conceal and exit without payment. The 'forgot to pay' narrative is undermined by concealment in a reusable bag and bypassing two self-checkout opportunities.",
      actualOpinionExcerpt:
        "The Court finds the defendant GUILTY of petit theft. Judgment: twelve months jail suspended; six months supervised probation; $200 restitution; completion of a theft-deterrence program.",
      isOverturned: false,
      whyExplanation:
        "Misdemeanor theft turns on whether the defendant intended to deprive the store of property. Concealment plus passing points of sale without scanning supports intent beyond a simple mistake.",
      maxPrecedents: 5,
      documents: {
        create: [
          {
            title: "Incident Report (Loss Prevention)",
            sortOrder: 0,
            isAdmissible: true,
            isMaterial: true,
            content:
              "LP observed defendant place two cosmetic items into a personal tote, pass all registers, and exit. Stop conducted; items recovered. Defendant stated 'I was in a hurry.'",
          },
          {
            title: "Surveillance Still Captures",
            sortOrder: 1,
            isAdmissible: true,
            isMaterial: true,
            content:
              "Still frames: aisle placement in tote, no scan at self-checkout, exit doors. Timestamped chain of custody to evidence locker.",
          },
          {
            title: "Cashier Witness Summary",
            sortOrder: 2,
            isAdmissible: true,
            isMaterial: true,
            content:
              "Cashier on duty did not ring defendant; recalls busy morning; did not see defendant attempt payment.",
          },
          {
            title: "Defendant Post-Miranda Statement",
            sortOrder: 3,
            isAdmissible: true,
            isMaterial: true,
            content:
              "Defendant: 'I meant to pay later at another store where I had coupons.' Asked why items were hidden in tote: 'So they wouldn't get damaged.'",
          },
          {
            title: "Anonymous Tip Printout (unverified)",
            sortOrder: 4,
            isAdmissible: false,
            isMaterial: false,
            content:
              "Third-party email alleging defendant 'always steals here' with no name, no firsthand observation, and no corroboration. Included in police packet by mistake.",
          },
        ],
      },
      precedents: {
        create: [
          {
            name: "State v. Booker — Retail Concealment",
            citation: "184 P.3d 612 (State App. 2008)",
            sortOrder: 0,
            isRelevant: true,
            weightMultiplier: 2.2,
            summary:
              "Concealment plus leaving the store without paying permits an inference of intent in misdemeanor shoplifting prosecutions.",
          },
          {
            name: "Model Penal Code § 223.1",
            citation: "MPC § 223.1 commentary",
            sortOrder: 1,
            isRelevant: true,
            weightMultiplier: 1.8,
            summary:
              "Theft requires purpose to deprive; momentary forgetting is a defense only if credible and consistent with innocent behavior.",
          },
          {
            name: "People v. Ramirez — Hearsay Tips",
            citation: "72 Cal. App. 4th 901",
            sortOrder: 2,
            isRelevant: true,
            weightMultiplier: 1.2,
            summary:
              "Anonymous tips without indicia of reliability are generally inadmissible for truth of the matter asserted in criminal trials.",
          },
          {
            name: "State v. Nguyen — DUI Sentencing",
            citation: "2011 WL 4488211",
            sortOrder: 3,
            isRelevant: false,
            weightMultiplier: 1,
            summary:
              "Addresses aggravating factors in felony impaired driving — not applicable to misdemeanor shoplifting.",
          },
          {
            name: "Acme Corp. v. Blue Ribbon Supply",
            citation: "429 F.3d 101 (1st Cir. 2005)",
            sortOrder: 4,
            isRelevant: false,
            weightMultiplier: 1,
            summary:
              "Commercial contract dispute about shipment timelines — irrelevant to criminal intent in retail theft.",
          },
        ],
      },
    },
  });

  const tier3 = await prisma.case.create({
    data: {
      title: "Harbor Freight Logistics v. Meridian Components — Contract Fraud",
      tier: 3,
      kind: CaseKind.CIVIL,
      category: "Commercial Litigation",
      briefSummary:
        "Plaintiff alleges defendant induced a shipment contract through fraudulent revenue projections and concealed supply-chain failures. Defendant argues the statements were optimistic puffery and that plaintiff failed to mitigate damages. The dispute turns on scienter, reliance, and the scope of damages.",
      parTimeMinutes: 25,
      correctVerdict: "LIABLE",
      correctSentenceText: "Judgment for plaintiff: $500,000 compensatory damages; no punitive damages.",
      correctSentenceNumeric: 500000,
      correctReasoningSummary:
        "Internal emails show knowledge of false capacity representations; plaintiff reasonably relied in expediting facility build-out. Damages tied to documented additional costs and lost margin on canceled orders.",
      actualOpinionExcerpt:
        "The Court finds defendant LIABLE for fraudulent inducement. Compensatory damages are awarded in the amount of $500,000. Punitive damages are denied given the absence of clear and convincing evidence of malice.",
      isOverturned: true,
      appellateReversalSummary:
        "The Court of Appeals vacated the damages award, holding the trial court erred by excluding probative expert testimony on market-based mitigation. The case was remanded for recalculation of damages not to exceed $320,000 absent new findings.",
      whyExplanation:
        "Fraud requires a false statement of material fact, scienter, reliance, and damages. Appellate courts may narrow damages if the trial court excluded key mitigation evidence, even when liability stands.",
      maxPrecedents: 6,
      documents: {
        create: [
          {
            title: "Complaint (Excerpts)",
            sortOrder: 0,
            isAdmissible: true,
            isMaterial: true,
            content:
              "Alleges knowing misrepresentations about on-time delivery rates and concealed supplier defaults during contract negotiations.",
          },
          {
            title: "Contract & SOW",
            sortOrder: 1,
            isAdmissible: true,
            isMaterial: true,
            content:
              "Master services agreement with SLA terms, liquidated damages clause, and integration clause referencing attached capacity tables.",
          },
          {
            title: "Email Thread — 'Q3 Capacity'",
            sortOrder: 2,
            isAdmissible: true,
            isMaterial: true,
            content:
              "Defendant's operations manager writes: 'We can hit 98% on-time if we dual-source by November.' Later reply: 'Dual-source is not funded; do not share that outside exec team.'",
          },
          {
            title: "Plaintiff CFO Deposition Excerpts",
            sortOrder: 3,
            isAdmissible: true,
            isMaterial: true,
            content:
              "CFO testifies build-out acceleration cost $410k and that three anchor customers canceled after delays, citing lost margin spreadsheets (Ex. 12).",
          },
          {
            title: "Defendant Expert Report (Damages Challenge)",
            sortOrder: 4,
            isAdmissible: true,
            isMaterial: true,
            content:
              "Expert opines plaintiff could have sourced alternate supplier within 45 days, reducing lost profits by roughly 40%—cites industry broker quotes.",
          },
          {
            title: "Invoice Ledger (Plaintiff)",
            sortOrder: 5,
            isAdmissible: true,
            isMaterial: true,
            content:
              "Itemized expedited shipping, overtime, and contractor invoices totaling $512k during disruption window.",
          },
          {
            title: "Industry Blog Reprint (unauthenticated)",
            sortOrder: 6,
            isAdmissible: false,
            isMaterial: false,
            content:
              "Printout of anonymous blog post speculating about defendant's finances; no author, no foundation for business records exception.",
          },
          {
            title: "HR Memo (Settlement Offer)",
            sortOrder: 7,
            isAdmissible: false,
            isMaterial: false,
            content:
              "Internal memo discussing early mediation strategy labeled 'for settlement purposes only'—likely inadmissible under Federal Rule 408.",
          },
          {
            title: "Warehouse Photos",
            sortOrder: 8,
            isAdmissible: true,
            isMaterial: false,
            content:
              "Photos of loading docks; corroborate facility expansion but not scienter.",
          },
          {
            title: "Press Release (Defendant)",
            sortOrder: 9,
            isAdmissible: true,
            isMaterial: false,
            content:
              "Generic marketing statements about 'industry-leading reliability' without specific metrics tied to plaintiff deal.",
          },
        ],
      },
      precedents: {
        create: [
          {
            name: "Restatement (Second) of Torts § 530",
            citation: "Restatement (Second) of Torts § 530",
            sortOrder: 0,
            isRelevant: true,
            weightMultiplier: 2.8,
            summary:
              "A fraudulent misrepresentation requires a false assertion of fact that the maker knows or believes to be false.",
          },
          {
            name: "SEC v. Texas Gulf Sulphur Co.",
            citation: "401 F.2d 833 (2d Cir. 1968)",
            sortOrder: 1,
            isRelevant: true,
            weightMultiplier: 2,
            summary:
              "Materiality and scienter in fraud contexts; illustrates strict scrutiny of insider knowledge versus public statements.",
          },
          {
            name: "Fed. R. Evid. 408 — Compromise Offers",
            citation: "Fed. R. Evid. 408",
            sortOrder: 2,
            isRelevant: true,
            weightMultiplier: 1.4,
            summary:
              "Evidence of settlement offers and negotiations is inadmissible to prove or disprove liability after a dispute arises.",
          },
          {
            name: "Daubert v. Merrell Dow Pharmaceuticals, Inc.",
            citation: "509 U.S. 579 (1993)",
            sortOrder: 3,
            isRelevant: true,
            weightMultiplier: 1.6,
            summary:
              "Trial judges must gate expert testimony for relevance and reliability; exclusion can warrant remand if outcome-determinative.",
          },
          {
            name: "Palsgraf v. Long Island R.R. Co.",
            citation: "248 N.Y. 339 (1928)",
            sortOrder: 4,
            isRelevant: false,
            weightMultiplier: 1,
            summary:
              "Classic proximate cause in negligence — distinguish fraud and contract reliance analyses.",
          },
          {
            name: "Miranda v. Arizona",
            citation: "384 U.S. 436 (1966)",
            sortOrder: 5,
            isRelevant: false,
            weightMultiplier: 1,
            summary:
              "Criminal procedure custodial interrogation warnings — not applicable to civil fraud trials.",
          },
          {
            name: "Business Records Hearsay — FRE 803(6)",
            citation: "Fed. R. Evid. 803(6)",
            sortOrder: 6,
            isRelevant: true,
            weightMultiplier: 1.2,
            summary:
              "Records of regularly conducted activity require custodian testimony and integrity of compilation—blogs usually fail.",
          },
          {
            name: "eBay Domestic Holdings, Inc. v. Newmark",
            citation: "2005 WL 91339 (Del. Ch.)",
            sortOrder: 7,
            isRelevant: false,
            weightMultiplier: 1,
            summary:
              "Fiduciary duty of founders in auction marketplace—factually distant from supplier fraud in logistics contract.",
          },
        ],
      },
    },
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.dailyChallenge.create({
    data: {
      date: today,
      caseId: tier1.id,
    },
  });

  console.log("Seed complete:", { tier1: tier1.id, tier2: tier2.id, tier3: tier3.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
