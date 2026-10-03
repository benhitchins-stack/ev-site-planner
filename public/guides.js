/* Guide library content and helpers, shared by the Guide Library page and the planner's help drawer.
   Guides run from plain-English basics (Start here) to advanced design notes for experienced electricians.
   The planner assists site design decisions; it does not certify electrical work. */
(function(){
'use strict';

const LEVELS=[
 {id:'start',n:1,label:'Start here',short:'Basics',who:'For anyone new to EV charging: site owners, council officers, customers and people joining the trade.',blurb:'What a charger does, what the words mean, why the electricity supply matters and what happens on a survey. No prior knowledge needed.'},
 {id:'plan',n:2,label:'Planning a site',short:'Planning',who:'For project managers, estimators and installers scoping a job.',blurb:'Choosing chargers, checking the supply, laying out bays, talking to the network operator and getting the paperwork in order.'},
 {id:'install',n:3,label:'Installing',short:'Installing',who:'For installers and apprentices on site.',blurb:'Protective devices, cables, bases and ducts, earthing, load management set-up, commissioning and the photo record.'},
 {id:'advanced',n:4,label:'Advanced design',short:'Advanced',who:'For experienced electricians and designers.',blurb:'Maximum demand, RCD types and DC fault detection, open-PEN options, volt drop, three-phase balance, surge and arc fault protection, and the regulations behind them.'}
];
const TOPICS=[
 ['basics','Basics'],['power','Power & protection'],['earth','Earthing & PEN'],['cable','Cabling'],['load','Load management'],
 ['civils','Civils & bays'],['comms','Connectivity'],['process','Process & regs'],['planner','Using the planner']
];
const KINDS={howto:'How-to',reference:'Reference',sheet:'Cheat sheet',planner:'Planner'};

/* Short, plain definitions. Guides mark a term with <dfn data-term="key">; tapping it shows the definition. */
const GLOSSARY={
 ac:{t:'AC and DC',d:'Alternating current (AC) is what the mains supplies. A car battery stores direct current (DC). An AC charger sends mains power to the car and the car converts it; a DC rapid charger does the conversion itself and feeds the battery directly, which is why it can be much faster.'},
 afdd:{t:'AFDD',d:'Arc fault detection device. A protective device that trips on the electrical signature of a damaged cable or loose connection, faults an RCD and MCB both miss.'},
 amp:{t:'Amps (A)',d:'The unit of electric current. A 7 kW charger draws about 32 A from a single-phase 230 V supply. A typical house has a 60, 80 or 100 A main fuse.'},
 bs7671:{t:'BS 7671',d:'The IET Wiring Regulations (18th Edition), the UK standard for electrical installations. Section 722 covers EV charging. Amendment 4:2026 applies to new work from 15 October 2026.'},
 cdm:{t:'CDM 2015',d:'The Construction (Design and Management) Regulations 2015. They apply to construction work, including EV installations, and set duties for clients, designers and contractors.'},
 cop:{t:'IET Code of Practice',d:'The IET Code of Practice for Electric Vehicle Charging Equipment Installation (5th Edition, 2023). The practical companion to BS 7671 Section 722.'},
 cpp:{t:'Construction phase plan',d:'A CDM document, proportionate to the job, that sets out how the work will be managed safely. One is needed before construction starts on every project.'},
 ct:{t:'CT clamp',d:'A current transformer clamped around a supply conductor to measure how much current is flowing, without breaking into the cable. Load limiters and load management use one on the incoming supply.'},
 cutout:{t:'Cut-out (service head)',d:'The sealed box where the network operator\'s cable enters the building. It holds the main fuse, which caps how much current the whole premises can draw. It belongs to the DNO and must never be opened by anyone else.'},
 diversity:{t:'Diversity',d:'A design allowance for the fact that not every load runs at once. EV charging circuits get no diversity: each charger is designed at its full rated current because it can run flat out for hours.'},
 dlm:{t:'Dynamic load management (DLM)',d:'A system that shares a limited supply between a group of chargers, slowing them down as more cars plug in so the total never exceeds the limit. Wired DLM uses a controller and data cables; cloud DLM balances the group over the internet.'},
 dno:{t:'DNO',d:'Distribution network operator: the company that owns and runs the local electricity network and the cable into the building. Every chargepoint is notified to the DNO, and larger schemes need their agreement first.'},
 eic:{t:'EIC',d:'Electrical installation certificate. The certificate issued for a new circuit, with its schedules of inspection and test results.'},
 ena:{t:'ENA Connect Direct',d:'The Energy Networks Association portal where installers notify or apply to any GB network operator for a chargepoint connection.'},
 evdb:{t:'EVDB',d:'EV distribution board: a board near the chargers that holds the protective device for each charger circuit, keeping the individual cable runs short.'},
 f10:{t:'F10 notification',d:'The notice sent to the Health and Safety Executive for larger construction projects (over 30 working days with more than 20 workers at once, or over 500 person-days).'},
 g99:{t:'G99',d:'The engineering recommendation covering generation connected to the network. Chargers that can export power to the grid (vehicle-to-grid) need a G99 application before they are energised.'},
 halfhourly:{t:'Half-hourly data',d:'Electricity meter readings taken every 30 minutes. They show the real peak demand of a site, which sets how much room is left for chargers.'},
 headroom:{t:'Headroom',d:'The spare capacity in a supply: the supply limit minus the existing maximum demand. It is the amount that new chargers can use.'},
 kw:{t:'kW and kWh',d:'A kilowatt (kW) is a rate of power, like the speed of a tap. A kilowatt-hour (kWh) is an amount of energy, like the water in the bucket. A 60 kWh battery charged at 7 kW takes roughly nine hours from empty.'},
 looped:{t:'Looped supply',d:'Two houses sharing one service cable from the street. A looped supply cannot use connect-and-notify; the DNO must be asked first.'},
 mcb:{t:'MCB',d:'Miniature circuit breaker. Protects a cable against overload and short circuit. On its own it gives no protection against earth leakage, which is why EV circuits use an RCBO or an RCD as well.'},
 md:{t:'Maximum demand',d:'The highest current a site actually draws, measured at its busiest half hour. Subtracting it from the supply limit gives the headroom for chargers.'},
 mode3:{t:'Mode 3',d:'AC charging through a dedicated charger (not a plug-in socket) that talks to the car over a control pilot signal. Almost every wall box and post is a Mode 3 charger.'},
 ocpp:{t:'OCPP',d:'Open Charge Point Protocol: the common language chargers use to talk to a back-office system for payments, monitoring and smart charging.'},
 opdd:{t:'Open-PEN device',d:'A device that watches the supply for signs of a broken PEN conductor and disconnects every conductor to the charger if it finds one. Many chargers have it built in; where not, a separate device or a TT earth is used.'},
 ozev:{t:'OZEV',d:'The Office for Zero Emission Vehicles, the government body that runs the chargepoint grant schemes and the authorised installer lists.'},
 partp:{t:'Part P',d:'The part of the Building Regulations (England and Wales) that covers electrical safety in homes. A new charger circuit is notifiable work.'},
 parts:{t:'Approved Document S',d:'The part of the Building Regulations (England) that requires chargepoints, or cable routes for them, in new homes and buildings with parking.'},
 pas1899:{t:'PAS 1899',d:'PAS 1899:2022, the British standard for accessible public chargepoints: bay sizes, hatched transfer zones, level ground, approach routes and the height of sockets and screens.'},
 pcpr:{t:'Public Charge Point Regulations 2023',d:'The rules for chargers the public can use: clear pricing in pence per kWh, contactless payment on new units of 8 kW and above, a free helpline, open data and reliability targets.'},
 pen:{t:'PEN conductor',d:'A single conductor that acts as both neutral and earth in a PME (TN-C-S) supply. If it breaks, metalwork earthed to it can rise to mains voltage, which is why outdoor charging needs open-PEN protection.'},
 phases:{t:'Single-phase and three-phase',d:'A single-phase supply has one live conductor (most homes). A three-phase supply has three, each able to carry the same current, so it delivers about three times the power. 11 kW and 22 kW chargers need three phases.'},
 pme:{t:'PME (TN-C-S)',d:'Protective multiple earthing, the most common UK supply arrangement. The network provides the earth through the combined neutral-and-earth (PEN) conductor.'},
 radial:{t:'Dedicated radial',d:'A circuit that runs from its own protective device at the board straight to one charger, with nothing else connected to it.'},
 rams:{t:'RAMS',d:'Risk assessment and method statement: a site-specific description of the work, its hazards and how they will be controlled, agreed before work starts.'},
 rcbo:{t:'RCBO',d:'A single device that combines a circuit breaker (overload and short circuit protection) with an RCD (earth leakage protection). The usual choice for a charger circuit: 40 A, Type A, 30 mA.'},
 rcd:{t:'RCD and its types',d:'Residual current device: trips when current leaks to earth. Type A detects AC and pulsed DC leakage and is the standard for EV circuits with a charger that has built-in DC detection. Type B also detects smooth DC. Type AC must not be used on EV circuits.'},
 rdcdd:{t:'RDC-DD',d:'Residual direct current detecting device: the 6 mA DC fault detection built into most modern chargers. With it fitted, a Type A RCD upstream is enough.'},
 smart:{t:'Smart charging regulations',d:'The Electric Vehicles (Smart Charge Points) Regulations 2021. Home and workplace chargers sold since 30 June 2022 must be smart: able to follow an off-peak schedule, with a random start delay and security requirements.'},
 spd:{t:'SPD',d:'Surge protective device. Fitted in the board to divert voltage spikes (from lightning or switching) away from sensitive electronics such as chargers.'},
 swa:{t:'SWA cable',d:'Steel wire armoured cable: the usual cable for outdoor and buried charger circuits. Its armour protects the cores and can carry earth fault current when properly glanded.'},
 tethered:{t:'Tethered and untethered',d:'A tethered charger has its own fixed cable and plug. An untethered (socketed) charger has a socket, and the driver uses their own cable.'},
 tns:{t:'TN-S',d:'A supply where the earth is a separate conductor all the way back to the transformer. Less common than PME; check it is a genuine TN-S supply before relying on it.'},
 tt:{t:'TT',d:'An earthing arrangement where the premises has its own earth electrode (a rod in the ground) instead of an earth from the network. Used where no TN earth is available or to isolate a charger from the PME earth.'},
 type2:{t:'Type 2 connector',d:'The standard AC charging plug in the UK and Europe. Tethered chargers carry one; untethered chargers have a Type 2 socket.'},
 vd:{t:'Volt drop',d:'The voltage lost along a cable because of its resistance. BS 7671 limits it to 5 % for power circuits (11.5 V on a 230 V supply). Long runs need thicker cable.'},
 wcs:{t:'Workplace Charging Scheme',d:'The OZEV grant for workplace chargers: up to £500 per socket, 75 % of costs, up to 40 sockets per applicant, for installs completed from 1 April 2026, through an authorised installer. Runs until 31 March 2027.'},
 zs:{t:'Earth fault loop impedance (Zs)',d:'The total impedance of the path a fault current takes to earth and back. It must be low enough for the protective device to trip within the required time.'}
};

/* Useful links shown at the foot of the library. */
const LINKS=[
 {t:'ENA Connect Direct',d:'Submit chargepoint notifications and applications to any GB network operator in one portal.',h:'https://connect-direct.energynetworks.org',s:'connect-direct.energynetworks.org'},
 {t:'ENA: connecting EVs to the networks',d:'The notification criteria, process flowchart, forms and FAQs behind connect-and-notify and apply-first.',h:'https://www.energynetworks.org/industry/connecting-to-the-networks/connecting-electric-vehicles-and-heat-pumps',s:'energynetworks.org'},
 {t:'Who is my network operator?',d:'Look up the DNO for any UK postcode before you notify or apply.',h:'https://www.energynetworks.org/customers/find-my-network-operator',s:'energynetworks.org'},
 {t:'GOV.UK: connecting chargepoints to the network',d:'The connection process for bigger sites: applications, quotes, costs and the 2023 reinforcement charge changes.',h:'https://www.gov.uk/government/publications/connecting-electric-vehicle-chargepoints-to-the-electricity-network/connecting-electric-vehicle-chargepoints-to-the-electricity-network',s:'gov.uk'},
 {t:'GOV.UK: EV chargepoint grants',d:'All live OZEV grant schemes and rates.',h:'https://www.gov.uk/guidance/electric-vehicle-chargepoint-grants',s:'gov.uk'},
 {t:'Workplace Charging Scheme',d:'Grant details and eligibility: up to £500 per socket, up to 40 sockets, for installs from 1 April 2026.',h:'https://www.find-government-grants.service.gov.uk/grants/workplace-charging-scheme-2',s:'find-government-grants.service.gov.uk'},
 {t:'IET: am I up to date with BS 7671?',d:'Current amendment status of the Wiring Regulations, including Amendment 4:2026 and transition dates.',h:'https://electrical.theiet.org/bs-7671-18th-edition-wiring-regulations/ensure-you-are-up-to-date-with-bs-7671/',s:'electrical.theiet.org'},
 {t:'IET Electrical: Codes of Practice',d:'Home of the Wiring Regulations and the Code of Practice for EV Charging Equipment Installation.',h:'https://electrical.theiet.org/',s:'electrical.theiet.org'},
 {t:'Smart Charge Points Regulations 2021',d:'The legal smart-functionality requirements for chargers sold for home and workplace use.',h:'https://www.legislation.gov.uk/uksi/2021/1467/contents',s:'legislation.gov.uk'},
 {t:'Public Charge Point Regulations 2023',d:'Payment, pricing, reliability and open-data duties for chargepoints open to the public.',h:'https://www.legislation.gov.uk/uksi/2023/1168/contents',s:'legislation.gov.uk'},
 {t:'Approved Document S',d:'Building Regulations (England): EV charging infrastructure in new homes and buildings with parking.',h:'https://www.gov.uk/government/publications/infrastructure-for-charging-electric-vehicles-approved-document-s',s:'gov.uk'},
 {t:'BSI Knowledge: PAS 1899',d:'Search "PAS 1899" for the free accessible-charging specification download.',h:'https://knowledge.bsigroup.com/',s:'knowledge.bsigroup.com'},
 {t:'Office for Zero Emission Vehicles',d:'Grant schemes, authorised-installer lists and approved chargepoint models.',h:'https://www.gov.uk/government/organisations/office-for-zero-emission-vehicles',s:'gov.uk'},
 {t:'Electricity at Work Regulations 1989',d:'The statutory duties behind safe isolation, live working and maintenance on every job.',h:'https://www.legislation.gov.uk/uksi/1989/635/contents',s:'legislation.gov.uk'}
];

const D=(k,label)=>'<dfn data-term="'+k+'">'+(label||GLOSSARY[k].t)+'</dfn>';
const G=(id,label)=>'<a href="#g='+id+'" data-guide="'+id+'">'+label+'</a>';
const TIP=html=>'<div class="g-tip"><b>On the plan:</b> '+html+'</div>';
const WARN=html=>'<div class="g-warn">'+html+'</div>';
const ART=key=>'<figure class="g-art" data-art="'+key+'"></figure>';
const SHOT=(file,cap)=>'<figure class="g-shot"><img src="assets/'+file+'" alt="" loading="lazy"><figcaption>'+cap+'</figcaption></figure>';
const CALC=key=>'<div class="g-calc" data-calc="'+key+'"></div>';

const GUIDES=[

/* ───────── Level 1 · Start here ───────── */
{id:'what-is-charging',level:'start',topic:'basics',kind:'reference',minutes:4,art:'chain',
 title:'How EV charging works, in plain English',
 summary:'What a charger actually does, the words you will hear on site, and why the car decides how fast it charges.',
 kw:'basics beginner what is a charger ac dc mode 3 type 2 tethered untethered wall box post how charging works plain english',
 related:['charging-speeds','supply-basics','rules-plain'],
 body:'<p>An electric car stores energy in a battery. Charging means moving energy from the mains into that battery. The box on the wall or the post in the car park is the <b>charger</b> (the trade calls it a chargepoint or EVSE). Despite the name, a normal AC charger does not charge the battery itself: it supplies mains power safely and talks to the car, and a converter inside the car does the rest.</p>'
 +ART('chain')
 +'<h4>The words you will hear</h4><ul>'
 +'<li>'+D('ac')+'. The mains is AC. The battery is DC. Where the conversion happens decides how fast a charge can be.</li>'
 +'<li>'+D('kw')+'. Chargers are described by the rate of power they can deliver: 7 kW, 11 kW, 22 kW, 50 kW and so on.</li>'
 +'<li>'+D('mode3')+'. The normal way a dedicated charger supplies a car. A control signal in the lead lets the charger and car agree what is safe before any power flows.</li>'
 +'<li>'+D('type2')+'. The UK standard AC plug. Nearly every car sold here takes it.</li>'
 +'<li>'+D('tethered')+'. A tethered unit has its own lead. An untethered unit has a socket and the driver brings a cable.</li>'
 +'<li>'+D('phases')+'. Most homes have one phase and top out at about 7 kW per charger. Three-phase supplies allow 11 kW and 22 kW units.</li>'
 +'</ul>'
 +'<h4>Who sets the speed</h4><p>The slowest link wins. A 22 kW charger connected to a car whose on-board converter accepts 7 kW will charge at 7 kW. A 150 kW rapid charger will slow down as the battery fills, especially past 80 %. Cold batteries also charge more slowly. So the number on the charger is a ceiling, not a promise.</p>'
 +'<h4>Why there is a dedicated circuit</h4><p>A charger is one of the biggest single loads in a building, and it can run flat out for hours. Each charger therefore gets its own circuit from the distribution board, with its own protective device, rather than sharing with sockets or lights. That is also why the size of the electricity supply matters so much: see '+G('supply-basics','why the supply decides everything')+'.</p>'
},

{id:'charging-speeds',level:'start',topic:'basics',kind:'reference',minutes:5,art:'speeds',
 title:'Slow, fast and rapid: what the kW figure means for charging time',
 summary:'How long a charge really takes at each power level, with a calculator you can try.',
 kw:'charging speed slow fast rapid ultra rapid kw kwh hours miles range time calculator 7kw 22kw 50kw 150kw',
 readFirst:['what-is-charging'],related:['choose-chargers','supply-basics'],
 body:'<p>Charging time is simple arithmetic: the energy the battery needs (kWh) divided by the power the charger delivers (kW), plus a little for losses. A 60 kWh battery charged from 20 % to 80 % needs 36 kWh. At 7 kW that is about five and a half hours; at 50 kW about 50 minutes.</p>'
 +ART('speeds')
 +'<h4>The usual power levels</h4><table class="g-table"><thead><tr><th>Type</th><th>Power</th><th>Supply</th><th>Typical use</th></tr></thead><tbody>'
 +'<tr><td>3-pin socket</td><td>2.3 kW</td><td>Ordinary socket</td><td>Emergency only. Not a charging installation.</td></tr>'
 +'<tr><td>Home or workplace charger</td><td>7 kW (7.4 kW at 32 A)</td><td>Single-phase</td><td>Overnight at home, all day at work. The most common unit.</td></tr>'
 +'<tr><td>Three-phase charger</td><td>11 kW or 22 kW</td><td>Three-phase</td><td>Workplaces, fleets, destinations. Only some cars take the full 22 kW on AC.</td></tr>'
 +'<tr><td>Rapid</td><td>50 kW DC</td><td>Three-phase, large</td><td>Forecourts, retail, en route. 30 to 60 minutes.</td></tr>'
 +'<tr><td>Ultra-rapid</td><td>100 to 350 kW DC</td><td>Dedicated supply, often a new substation</td><td>Motorway and hub sites.</td></tr>'
 +'</tbody></table>'
 +'<h4>Try it</h4>'+CALC('charge-time')
 +'<p>Two things change the answer in practice. The car\'s own on-board charger caps AC charging (many cars accept 7 kW, some 11 kW, fewer 22 kW). And DC rapid charging slows down as the battery fills, so the last 20 % takes much longer than the first 20 %.</p>'
 +'<h4>Which speed does a site need?</h4><p>Match the charger to how long cars will be parked. A car that sits for eight hours needs 7 kW, not 50 kW. Fitting more power than the dwell time needs costs more to install and more to supply. '+G('choose-chargers','Choosing charger types and numbers')+' takes this further.</p>'
},

{id:'supply-basics',level:'start',topic:'basics',kind:'reference',minutes:5,art:'headroom',
 title:'Why the electricity supply decides everything',
 summary:'The main fuse, phases and headroom explained without jargon, and what happens when the sums do not fit.',
 kw:'supply main fuse cut out headroom capacity single phase three phase dno upgrade basics beginner amps',
 readFirst:['what-is-charging'],related:['md','dlm-plain','dno'],
 body:'<p>Every building has a limit on how much electricity it can draw at once, set by the <b>main fuse</b> in the '+D('cutout','cut-out')+' where the network cable comes in. Homes usually have 60, 80 or 100 '+D('amp','amps')+'. Commercial sites have an agreed capacity, often quoted in kVA. Everything already in the building (heating, kitchens, lifts, lighting) shares that limit. Chargers have to fit in what is left.</p>'
 +ART('headroom')
 +'<h4>Three numbers to find</h4><ol>'
 +'<li><b>The supply limit.</b> The main fuse rating, or the agreed capacity for a bigger site. Never open the cut-out to look: read the label, or ask the '+D('dno','DNO')+'.</li>'
 +'<li><b>What the building already uses</b> at its busiest: the '+D('md','maximum demand')+'. For a business, '+D('halfhourly','half-hourly meter data')+' shows it exactly.</li>'
 +'<li><b>What the chargers will add.</b> A 7 kW charger uses 32 A. Chargers are counted at full load because they can run for hours, so two chargers count as 64 A even if they are rarely both busy.</li>'
 +'</ol><p>Limit minus existing demand is the '+D('headroom')+'. If the chargers fit inside it, the design is straightforward.</p>'
 +'<h4>When the sums do not fit</h4><ul>'
 +'<li><b>Load management.</b> The chargers share whatever is spare and slow down when the building is busy. Cheaper and quicker than a bigger supply. See '+G('dlm-plain','load management in plain terms')+'.</li>'
 +'<li><b>A bigger supply.</b> The DNO can upgrade the fuse or the cable. This takes weeks to months and may cost a lot, so find out early.</li>'
 +'<li><b>Fewer or slower chargers.</b> Four 7 kW chargers that always work may serve a site better than eight that are starved.</li>'
 +'</ul>'
 +'<h4>Single-phase or three-phase?</h4><p>A '+D('phases','single-phase')+' supply feeds 7 kW chargers. Three-phase supplies allow 11 kW and 22 kW units and carry three times the power, but single-phase chargers must then be shared evenly across the three phases. Most homes are single-phase; most commercial buildings are three-phase.</p>'
 +TIP('enter the main fuse or supply rating in Project details and the Supply load check card adds up the chargers as you place them.')
},

{id:'survey-basics',level:'start',topic:'basics',kind:'howto',minutes:5,art:'survey',
 title:'What happens on a site survey',
 summary:'The six things a surveyor looks at, why each one matters and what to have ready.',
 kw:'site survey what happens visit prepare photos supply meter route parking signal access beginner',
 readFirst:['supply-basics'],related:['survey-checklist','planner-first-project','where-chargers-go'],
 body:'<p>A survey is a structured look at the site before anything is designed or priced. It usually takes an hour or two. The surveyor is answering one question: what will it take to get the right chargers, safely connected, into the right places?</p>'
 +ART('survey')
 +'<h4>The six things they look at</h4><ol>'
 +'<li><b>The supply.</b> The cut-out and main fuse, the meter, the earthing arrangement and whether the supply is shared ('+D('looped','looped')+'). This sets the budget for power.</li>'
 +'<li><b>The distribution board.</b> Is there room for new circuits, and is the board in good condition? Sometimes a new board near the chargers is simpler.</li>'
 +'<li><b>The cable route.</b> How the cable gets from the board to each charger: through walls, under paths, across a car park. Every crossing adds work. The route length drives both cost and cable size.</li>'
 +'<li><b>Charger positions and bays.</b> Where cars will park, which way they face, where the charging socket on the car will be and whether accessible bays are needed.</li>'
 +'<li><b>Signal.</b> Chargers need to be online for payments, monitoring and smart charging. The surveyor checks mobile and Wi-Fi signal at each charger position, not at the front door.</li>'
 +'<li><b>Access, lighting and signs.</b> Can the installers get a van and plant in? Are the bays lit at night? Will drivers find the chargers and keep the bays clear?</li>'
 +'</ol>'
 +'<h4>What to have ready</h4><ul><li>Recent electricity bills or, better, half-hourly data from the supplier.</li><li>Any existing drawings of the site and services (electric, gas, water, drainage).</li><li>Who owns the land and the parking, and whether the landlord must agree.</li><li>How many cars need charging, how long they stay and whether the public will use the chargers.</li></ul>'
 +'<p>The surveyor photographs everything. Those photos become the evidence behind the design, the quotation, the DNO application and any grant claim. The planner is built around that photo record: see '+G('planner-first-project','your first project in the planner')+'.</p>'
},

{id:'who-does-what',level:'start',topic:'process',kind:'reference',minutes:4,
 title:'Who does what: client, installer, network operator and council',
 summary:'The people involved in a charging project and what each of them is responsible for.',
 kw:'who does what roles client installer dno network operator council planning landlord grant ozev responsibilities beginner',
 readFirst:['what-is-charging'],related:['rules-plain','grants-paperwork','dno'],
 body:'<ul>'
 +'<li><b>The client</b> (homeowner, business, landlord or council) owns the site and the decision. They choose what they want, pay for it and, on commercial work, carry duties under '+D('cdm','CDM 2015')+' as the client.</li>'
 +'<li><b>The installer</b> surveys, designs, installs, tests and certifies the electrical work, and notifies the network operator. For grants they must be on the '+D('ozev','OZEV')+' authorised list. Domestic work is notified under '+D('partp','Part P')+' through a competent person scheme.</li>'
 +'<li><b>The '+D('dno','network operator (DNO)')+'</b> owns the cable into the building and the main fuse. They are told about every charger, agree bigger connections in advance and carry out any supply upgrade.</li>'
 +'<li><b>The charger manufacturer or operator</b> provides the equipment and, for public sites, often the back-office system that takes payments and monitors the units.</li>'
 +'<li><b>The council</b> may be the client, the planning authority or the highways authority. Chargers on or near the public highway, in conservation areas or on listed buildings need their say. Councils also enforce the accessibility and parking rules on their own sites.</li>'
 +'<li><b>The electricity supplier</b> (the company that sends the bill) is separate from the DNO. They hold the half-hourly data and set the tariff.</li>'
 +'</ul>'
 +'<h4>A typical sequence</h4><ol><li>Client asks for chargers.</li><li>Installer surveys and designs; see '+G('survey-basics','what happens on a survey')+'.</li><li>Network operator is notified or asked for capacity; see '+G('dno','DNO notification and applications')+'.</li><li>Planning or landlord consent where needed.</li><li>Installation, testing and certificates.</li><li>Handover: app set up, paperwork left, grant claimed.</li></ol>'
 +'<p>The planner keeps the survey, drawings, programme, snag list and documents in one project so each of these people can see the same picture.</p>'
},

{id:'where-chargers-go',level:'start',topic:'civils',kind:'howto',minutes:5,
 title:'Choosing where chargers go',
 summary:'Bays, lead reach, cable routes, accessibility and the things that get forgotten.',
 kw:'where to put chargers position location bays lead reach cable route accessible wall post pedestal beginner',
 readFirst:['survey-basics'],related:['bays','signage','base'],
 body:'<p>Good charger positions are decided by the cars, not the cable. Start from where cars will actually park and which side their charging socket is on, then work back to the board.</p>'
 +'<h4>Reach</h4><p>A tethered lead is typically 5 m; drivers\' own cables 5 to 7.5 m. The socket is at the front, the side or the back of the car depending on the model, so a charger at the head of a bay suits most cars, while a charger between two bays can serve both if the lead reaches round.</p>'
 +'<h4>Wall or post?</h4><ul><li><b>Wall-mounted</b> units are cheaper, with no base to pour, but need a wall within reach of the bay.</li><li><b>Posts (pedestals)</b> go anywhere in a car park but need a concrete base and a buried duct; see '+G('base','bases and ducts')+'.</li><li><b>Twin units</b> serve two bays from one position and one base.</li></ul>'
 +'<h4>Think about</h4><ul>'
 +'<li><b>Protection from vehicles:</b> wheel stops or bollards where a car could hit the unit.</li>'
 +'<li><b>Accessible bays:</b> wider bays with a hatched transfer zone and a charger reachable from a wheelchair. See '+G('bays','bay marking and accessible charging')+'.</li>'
 +'<li><b>The cable route:</b> the shortest safe route from the board; every road crossing and tree root adds cost.</li>'
 +'<li><b>Lighting and signs:</b> chargers are used after dark and bays need to be kept for charging.</li>'
 +'<li><b>Signal:</b> the units must get online where they stand.</li>'
 +'<li><b>Future positions:</b> leaving a spare duct or cable today is far cheaper than digging again later.</li>'
 +'</ul>'
 +TIP('place charger symbols on a photo of the car park, then draw the bays with the Bay tool and the cable run with a route. The lead-reach arc on each charger shows which bays it can serve.')
},

{id:'rules-plain',level:'start',topic:'process',kind:'reference',minutes:6,
 title:'The rules in plain English',
 summary:'The standards and regulations that shape every charging installation, and what each one is for.',
 kw:'rules regulations standards plain english bs 7671 iet code of practice smart regulations public charge point regulations pas 1899 part s part p cdm beginner',
 readFirst:['who-does-what'],related:['regs','pcpr','cdm'],
 body:'<p>Several documents govern EV charging in the UK. You do not need to read them to understand a project, but it helps to know what each one is for.</p>'
 +'<table class="g-table"><thead><tr><th>Document</th><th>What it is</th><th>Why it matters</th></tr></thead><tbody>'
 +'<tr><td>'+D('bs7671','BS 7671')+'</td><td>The Wiring Regulations</td><td>How every circuit is designed, installed and tested. Section 722 is the EV chapter.</td></tr>'
 +'<tr><td>'+D('cop','IET Code of Practice')+'</td><td>Practical guidance for EV installations</td><td>Turns the regulations into site practice: cable depths, earthing choices, accessibility.</td></tr>'
 +'<tr><td>'+D('smart','Smart Charge Points Regulations 2021')+'</td><td>Law for home and workplace chargers</td><td>Units must be smart and secure out of the box.</td></tr>'
 +'<tr><td>'+D('pcpr','Public Charge Point Regulations 2023')+'</td><td>Law for public chargers</td><td>Clear pricing, contactless payment, a helpline, open data and reliability.</td></tr>'
 +'<tr><td>'+D('pas1899','PAS 1899:2022')+'</td><td>Accessible charging standard</td><td>Bay sizes, approach routes and reachable controls for disabled drivers.</td></tr>'
 +'<tr><td>'+D('parts','Approved Document S')+'</td><td>Building Regulations (England)</td><td>New homes and buildings with parking must include chargepoints or cable routes.</td></tr>'
 +'<tr><td>'+D('partp','Part P')+'</td><td>Building Regulations for homes</td><td>A new charger circuit at home is notifiable electrical work.</td></tr>'
 +'<tr><td>'+D('cdm','CDM 2015')+'</td><td>Construction safety law</td><td>Applies to every installation, with a plan for how the work is managed safely.</td></tr>'
 +'</tbody></table>'
 +'<p>Behind these sit the '+D('dno','DNO')+' connection rules (every charger is notified; larger loads need agreement first) and the '+D('ozev','OZEV')+' grant conditions where public money is involved.</p>'
 +'<p>The detailed guides for electricians are in '+G('regs','Installation regulations and standards')+' and '+G('pcpr','Public charging sites: the consumer-facing rules')+'.</p>'
},

{id:'planner-first-project',level:'start',topic:'planner',kind:'planner',minutes:6,
 title:'Your first project in the planner',
 summary:'From a photo of the site to a marked-up plan in five steps.',
 kw:'planner first project getting started how to use tutorial new project photo plan markup scale chargers export beginner tour',
 related:['scale','routes','planner-backups','planner-markup-tools'],
 body:'<p>The planner works from pictures of the site: a photo, a PDF drawing or a survey ZIP. You mark the chargers, bays and cable runs on the picture, and the planner turns that into quantities, checks and documents.</p>'
 +SHOT('guide-home.jpg','Home shows the project to continue, recent projects and the guides.')
 +'<ol class="g-steps">'
 +'<li><b>Start a project.</b> On Home, choose New project and fill in the site name, address and whether it is domestic or commercial. The mode changes the equipment on offer and the checks.</li>'
 +'<li><b>Add a plan.</b> Open Markup and add a site photo, a PDF drawing or a survey ZIP. Each picture becomes a plan in the project.</li>'
 +'<li><b>Set the scale.</b> Drag along something of known length (a parking bay is 4.8 m) and type the length. Everything you draw is now measured. See '+G('scale','Set the plan scale')+'.</li>'
 +'<li><b>Place equipment and routes.</b> Pick chargers, boards and site kit from the equipment picker, draw bays with the Bay tool, and draw cable runs with the route tools. Lengths and quantities update as you go. See '+G('routes','Route lengths and quantities')+'.</li>'
 +'<li><b>Check and issue.</b> The Checks tab shows the supply load, readiness and compliance items. Review &amp; issue makes the PDF pack: plans, engineer pack, programme and snag report.</li>'
 +'</ol>'
 +SHOT('guide-markup.jpg','Markup: the tool strip, the plan and the panel with the selected item.')
 +'<h4>Where things live</h4><ul><li><b>Overview</b> is the project home: next actions, record checks and backups.</li><li><b>Markup</b> is the drawing page.</li><li><b>Design lab</b> keeps survey evidence, compares options and runs charging-day scenarios.</li><li><b>Programme</b> and <b>Snags</b> plan the work and record findings.</li><li><b>Review &amp; issue</b> makes the documents.</li></ul>'
 +WARN('Projects are saved in this browser only. Download a backup from the Overview before clearing the browser or moving to another device. See '+G('planner-backups','Saving, backups and recovery')+'.')
 +'<p>Every page has a Help button in its header and small ? buttons beside its tools that open the guide for that feature.</p>'
},

{id:'planner-backups',level:'start',topic:'planner',kind:'planner',minutes:3,
 title:'Saving, backups and recovery',
 summary:'Where projects are stored, why backups matter and how to move a project to another device.',
 kw:'save autosave backup restore recover storage browser safari ipad move project another device home screen app json',
 readFirst:['planner-first-project'],related:['planner-first-project'],
 body:'<p>The planner has no account and no server. Everything you draw is saved automatically in this browser, on this device, for this web address. That keeps your projects private, and it means you are responsible for keeping a copy.</p>'
 +'<ul><li><b>Autosave</b> runs as you work. The save state is shown at the top of the workspace.</li>'
 +'<li><b>Backup</b> downloads the whole project as a file. Do this at the end of each working session and before any browser clean-up. The Overview reminds you when a backup is overdue.</li>'
 +'<li><b>Open backup</b> on Home or Your projects loads a backup file as a separate project, so an older copy never overwrites your current work.</li>'
 +'<li><b>Recover missing projects</b> at the foot of Your projects restores saved records that have dropped out of the project list.</li></ul>'
 +WARN('Safari may clear a site\'s storage after about a week without a visit, and an app added to the Home Screen keeps its own separate storage. Use a backup to move projects between Safari and the Home Screen app, or between devices.')
},

/* ───────── Level 2 · Planning a site ───────── */
{id:'choose-chargers',level:'plan',topic:'basics',kind:'howto',minutes:6,
 title:'Choosing charger types and numbers',
 summary:'Match power, connector and count to how the site is used, before the supply is checked.',
 kw:'choose chargers how many which type 7kw 11kw 22kw twin rapid dc tethered socketed dwell time fleet workplace destination public',
 readFirst:['charging-speeds','supply-basics'],related:['dlm-plain','md','where-chargers-go'],
 body:'<h4>Start from dwell time</h4><table class="g-table"><thead><tr><th>Site</th><th>Cars stay</th><th>Usual choice</th></tr></thead><tbody>'
 +'<tr><td>Home</td><td>Overnight</td><td>One 7 kW tethered unit, smart, with a load limiter if the main fuse is small.</td></tr>'
 +'<tr><td>Workplace</td><td>All day</td><td>7 kW sockets, as many as the supply allows with load management; twin posts save civils.</td></tr>'
 +'<tr><td>Fleet depot</td><td>Overnight, every night</td><td>7 to 22 kW per vehicle depending on daily mileage; load management to fit the supply; plan for growth.</td></tr>'
 +'<tr><td>Destination (retail, leisure, hotel)</td><td>1 to 4 hours</td><td>7 to 22 kW AC, perhaps one or two 50 kW rapids. Public rules apply.</td></tr>'
 +'<tr><td>En route, forecourt</td><td>Under an hour</td><td>50 to 350 kW DC. A different scale of supply and civils.</td></tr>'
 +'</tbody></table>'
 +'<h4>Decisions that follow</h4><ul>'
 +'<li><b>Tethered or socketed.</b> Tethered is convenient at home and for fleets. Public and workplace sites usually use sockets: no lead to vandalise, and drivers carry their own.</li>'
 +'<li><b>Single or twin.</b> A twin post serves two bays from one base and one duct.</li>'
 +'<li><b>Three-phase units.</b> 11 kW and 22 kW need a three-phase supply, and a three-phase group balances itself across the phases. On a single-phase supply the ceiling is 7 kW.</li>'
 +'<li><b>Count.</b> Chargers are counted at full load (32 A each for 7 kW) because they can run for hours. Use '+G('md','the maximum demand check')+' to see how many fit, and '+G('dlm-plain','load management')+' to fit more.</li>'
 +'<li><b>Brand and back office.</b> Public sites need payment, a helpline and open data from day one; workplace sites may want access control. Load management normally needs chargers from one brand.</li>'
 +'<li><b>Passive provision.</b> Ducts or cables to future positions, terminated and recorded, so the site can grow without digging again.</li>'
 +'</ul>'
 +TIP('the equipment picker groups chargers by mounting and power. Pick the variant that matches the real unit so the supply and protection line in its panel is right.')
},

{id:'dlm-plain',level:'plan',topic:'load',kind:'reference',minutes:5,art:'dlm',
 title:'Load management in plain terms',
 summary:'How a group of chargers shares a limited supply, and when it is the right answer.',
 kw:'load management dlm plain english sharing supply limit group balancing wired cloud load limiter ct clamp beginner',
 readFirst:['supply-basics'],related:['array','limiter','arrtool'],
 body:'<p>Most sites cannot give every charger full power at the same time without a bigger supply. '+D('dlm','Dynamic load management')+' solves this by treating a group of chargers as one shared budget. When one car is plugged in it gets everything. As more cars arrive, each charger slows down a little so the total never goes over the limit. Cars still charge; they just share.</p>'
 +ART('dlm')
 +'<h4>Two ways to do it</h4><ul>'
 +'<li><b>Wired.</b> A controller or load management board watches the supply through a '+D('ct','CT clamp')+' and talks to each charger over a data cable. Fast, and it keeps working if the internet drops.</li>'
 +'<li><b>Cloud.</b> The chargers\' back office balances the group over the internet. No extra hardware or data cabling, but every unit needs a reliable connection and a safe fallback rate when it loses one.</li>'
 +'</ul>'
 +'<h4>What it is not</h4><p>A single home charger with a <b>load limiter</b> is a simpler relative: a CT clamp on the incoming supply lets the charger slow down when the house is busy, so it fits behind a small main fuse. See '+G('limiter','CT-clamp load limiting')+'.</p>'
 +'<h4>Things to know</h4><ul><li>Each charger has a minimum rate (about 6 A). Below that, cars queue until capacity frees up.</li><li>The group limit is set a little below the fuse or agreed capacity, never at it.</li><li>The sub-main and switchgear are still sized for the full group limit.</li><li>Features differ by brand: group size, mixing of 7, 11 and 22 kW units, offline behaviour and remote adjustment. Design from the manufacturer\'s current documentation.</li></ul>'
 +'<p>Installer detail is in '+G('array','Set up dynamic load management')+'.</p>'
},

{id:'md',level:'plan',topic:'power',kind:'howto',minutes:6,course:['dom',1],
 title:'Assess maximum demand before you design',
 summary:'Headroom is supply capacity minus existing demand. Find both before placing a charger.',
 kw:'maximum demand headroom supply capacity cut-out half hourly data kva assessment load check calculator',
 readFirst:['supply-basics'],related:['radial','dlm-plain','dno','arrtool'],
 body:'<p>'+D('headroom','Headroom')+' = supply capacity minus existing '+D('md','maximum demand')+'. Establish both before placing a single charger:</p><ul>'
 +'<li><b>Supply capacity:</b> read the cut-out or service fuse rating, or the agreed capacity (kVA) on a CT-metered supply. Never open the cut-out; that is the DNO\'s.</li>'
 +'<li><b>Existing demand:</b> '+D('halfhourly','half-hourly data')+' from the energy supplier is best; otherwise a logged measurement over a representative week, at the worst season.</li>'
 +'<li><b>New load:</b> full rating per socket, no '+D('diversity')+': 32 A at 7 kW, 16 A per phase at 11 kW, 32 A per phase at 22 kW. Then decide whether '+D('dlm','dynamic load management')+' brings it inside the headroom.</li>'
 +'</ul>'
 +'<h4>Try it</h4>'+CALC('headroom')
 +TIP('enter the supply rating in Project details and the Supply load check card tracks connected load live. DLM groups count at their group limit, not the sum of their sockets.')
},

{id:'bays',level:'plan',topic:'civils',kind:'howto',minutes:5,art:'bays',course:['com',4],
 title:'Bay marking and accessible charging (PAS 1899)',
 summary:'Standard bay sizes, EV-only marking, and what PAS 1899 asks of accessible bays.',
 kw:'bay marking accessible pas 1899 wheel stops ev only lettering hatched zone wheelchair 2.4 4.8 transfer zone',
 readFirst:['where-chargers-go'],related:['signage','base','pcpr'],
 body:ART('bays')
 +'<ul><li><b>Standard bay</b> 2.4 × 4.8 m, painted "EV only" lettering and a contrasting strip at the open end so drivers stop within cable reach; wheel stops protect the unit.</li>'
 +'<li>'+D('pas1899','PAS 1899:2022')+' is the accessible-charging specification: wider bays with hatched transfer zones, level ground, clear approach routes, and controls and sockets reachable from a wheelchair (typically 0.75 to 1.2 m above ground).</li>'
 +'<li>Plan at least some accessible provision on public and workplace sites. Grant and planning conditions increasingly expect it, and retrofitting bay layouts is expensive.</li></ul>'
 +TIP('the Bay tool has an Accessible type that draws the hatched access zone; set the hatch side to suit the transfer space.')
},

{id:'signage',level:'plan',topic:'civils',kind:'howto',minutes:4,course:['com',4],
 title:'Bay signage, lighting and access',
 summary:'Signs, enforcement, lighting after dark and the evidence to photograph at handover.',
 kw:'signage lighting enforcement ev only sign tariff bays usable after dark glare approach route handover evidence planning condition blocked ice',
 readFirst:['bays'],related:['bays','pcpr'],
 body:'<ul><li><b>Signage:</b> an "EV charging only" sign per bay or pair, plus operator and tariff information where the public charges. Fix signs clear of door swings, the hatched transfer zone and the charging lead\'s reach.</li>'
 +'<li><b>Enforcement:</b> agree up front who polices the bays and how: parking terms, warnings, fines or barriers. Record who will manage misuse of the charging bays.</li>'
 +'<li><b>Lighting:</b> walk the site after dark. You want even light at each charger and along the approach route, no deep shadow between car and socket, and no glare into drivers\' eyes. PAS 1899 expects accessible bays to be well lit, and units are commissioned and serviced after dark too.</li>'
 +'<li><b>Evidence:</b> photograph the signed, lit bays at handover. Planning conditions and grant claims increasingly ask for proof.</li></ul>'
 +TIP('the Bay tool draws the EV-ONLY lettering and green band; drop a Label or marker where signs and lighting columns go to record their positions for the drawing and photo record.')
},

{id:'dno',level:'plan',topic:'process',kind:'howto',minutes:5,course:['dom',4],
 title:'DNO notification and applications',
 summary:'Connect-and-notify or apply first, what the ENA criteria are, and why to talk to the DNO early.',
 kw:'dno notification application ena connect direct 28 days 10 working days looped supply reinforcement network operator g99',
 readFirst:['supply-basics','who-does-what'],related:['md','regs'],
 body:'<p>Every chargepoint must be notified to the network operator; it is how the '+D('dno','DNO')+' keeps the local network safe as load grows. The route depends on the installation:</p><ul>'
 +'<li><b>Connect and notify (within 28 days):</b> only when the ENA criteria all hold: a single new unit, cut-out rating known, no '+D('looped','looped service')+', metered supply, and maximum demand stays under the cut-out and under about 60 A (13.8 kVA) per phase.</li>'
 +'<li><b>Apply first:</b> everything else: multiple chargers, load-managed systems, tight headroom or looped services. The DNO has 10 working days to respond to a notification; larger schemes get a connection offer instead.</li>'
 +'<li>Submissions go through the '+D('ena','ENA Connect Direct')+' portal. Since April 2023, demand customers are not charged for upstream network reinforcement; you pay only for your own connection assets.</li>'
 +'<li>Export-capable (vehicle-to-grid) units need a '+D('g99','G99')+' application approved before energising.</li>'
 +'<li>Talk to the DNO early on multi-charger sites: capacity data shapes the whole design.</li></ul>'
 +TIP('the DNO application data sheet in the Technical menu gathers the supply, earthing and charger details the portal asks for.')
},

{id:'comms',level:'plan',topic:'comms',kind:'howto',minutes:4,course:['com',5],
 title:'Check charger connectivity',
 summary:'Mobile, Wi-Fi or Ethernet: what each needs and why an offline charger fails commissioning.',
 kw:'connectivity online 4g 3g wifi 2.4ghz ethernet cat5e cat6 captive portal ssid commissioning signal brand model manufacturer',
 readFirst:['survey-basics'],related:['data','array','pcpr'],
 body:'<ul><li><b>Mobile (3G/4G):</b> available on some commercial units; confirm the fitted modem and service. Check signal at the actual charger location, not the car park entrance.</li>'
 +'<li><b>Wi-Fi:</b> 2.4 GHz only on most units; a dedicated 2.4 GHz SSID beats a dual-band network. Private and secured; no captive portals or guest login pages. Watch vendor limits on SSID and password length.</li>'
 +'<li><b>Ethernet:</b> where the unit has a port (not all do): shielded Cat5e or Cat6, live before install day, straight to the network; again, no portals.</li>'
 +'<li>Smart-charging regulations assume connectivity: an offline charger fails commissioning outright.</li></ul>'
 +WARN('<b>Varies by brand and model:</b> which of these interfaces a charger actually has differs between makes and models. Confirm the fitted options on the data sheet before designing the comms.')
},

{id:'grants-paperwork',level:'plan',topic:'process',kind:'reference',minutes:5,
 title:'Grants, permissions and paperwork',
 summary:'What funding exists, when planning permission is needed and the documents a project should end with.',
 kw:'grants workplace charging scheme wcs ozev planning permission permitted development listed building landlord consent paperwork documents part s',
 readFirst:['who-does-what','rules-plain'],related:['regs','cert','quote-pack'],
 body:'<h4>Grants</h4><ul><li>The '+D('wcs','Workplace Charging Scheme')+' covers part of the cost of workplace sockets through an '+D('ozev','OZEV')+'-authorised installer. Rates, caps and dates change; check GOV.UK before quoting and keep the photos the claim needs.</li><li>Other OZEV schemes cover renters, flats, landlords and some fleets. Check the live list rather than relying on memory.</li></ul>'
 +'<h4>Permissions</h4><ul><li>Many wall-mounted chargers and car park posts are permitted development in England, within limits on size and distance from the highway. Listed buildings, conservation areas, flats and anything on the public highway need the planning authority\'s view first.</li><li>Leaseholders and tenants need the landlord\'s written consent for the works and the cable route.</li><li>'+D('parts','Approved Document S')+' sets what new buildings with parking must provide from the outset.</li></ul>'
 +'<h4>Paperwork a finished job should have</h4><ul><li>'+D('eic','EIC')+' with schedules of inspection and test results; '+D('partp','Part P')+' notification for homes.</li><li>DNO notification or connection agreement reference.</li><li>Manufacturer registration and warranty; smart regulations compliance statement.</li><li>Marked-up drawings, the photo record, the programme and the snag close-out.</li><li>CDM documents on commercial work: '+D('cpp','construction phase plan')+', '+D('rams','RAMS')+', appointments.</li></ul>'
 +TIP('Review &amp; issue collects the drawings, engineer pack, programme and snag report in one place; the Checks tab tracks the compliance items per job.')
},

{id:'quote-pack',level:'plan',topic:'process',kind:'howto',minutes:4,
 title:'What goes in a quote and the project pack',
 summary:'The items a complete quotation covers, and the documents the client should receive.',
 kw:'quote quotation estimate project pack scope civils supply upgrade exclusions assumptions client documents',
 readFirst:['survey-basics'],related:['grants-paperwork','routes','cert'],
 body:'<h4>In the quotation</h4><ul>'
 +'<li><b>Scope:</b> how many chargers, which model, where, and what each bay gets (marking, wheel stop, sign).</li>'
 +'<li><b>Electrical:</b> new board or ways, protective devices, cable type and measured route lengths, earthing arrangement, surge protection.</li>'
 +'<li><b>Civils:</b> bases, trenching and ducting by the metre, road crossings, reinstatement by surface type.</li>'
 +'<li><b>Load management and comms:</b> controller, data cabling or cloud subscription; connectivity provision.</li>'
 +'<li><b>Public sites:</b> payment terminal, helpline contract and data feed. These belong in the quote, not the snag list.</li>'
 +'<li><b>DNO and permissions:</b> who applies, and what happens if a supply upgrade is needed.</li>'
 +'<li><b>Assumptions and exclusions:</b> headroom figures used, ground conditions assumed, anything the client provides.</li>'
 +'</ul>'
 +'<h4>In the project pack at handover</h4><ul><li>Marked-up plans and the engineer pack.</li><li>Certificates and the DNO reference.</li><li>Programme and the snag close-out.</li><li>The photo record: supply head, board, cable runs, bases before surfacing, finished bays.</li><li>User guide, app set-up and warranty details.</li></ul>'
 +TIP('the route totals and equipment schedule price themselves from your rates in the Budget card; the engineer pack and marked-up plans come from Review &amp; issue.')
},

{id:'scale',level:'plan',topic:'planner',kind:'planner',minutes:3,
 title:'Set the plan scale',
 summary:'Mark a known length on each photo so routes, bays and equipment are measured.',
 kw:'set the scale photo measure true size planner readiness bay 4.8 door brick',
 readFirst:['planner-first-project'],related:['routes','planner-markup-tools'],
 body:SHOT('guide-scale.jpg','Set scale: drag along a known length, then type it.')
 +'<p>The photo scale controls route lengths, lead-reach arcs and the drawn size of chargers and bays. Use <b>Set scale</b>, drag along something with a known length (a parking bay is about 4.8 m, a door about 0.9 m, a marked dimension on a site plan), then enter the measured length. Set the scale separately for each photo. The readiness score flags any plan still missing its scale.</p>'
 +'<p>Handy sizes on a photo: a metre is about four and a half brick lengths or 13 brick courses; a paving slab is 0.45 or 0.6 m; a fence panel 1.8 m; a car about 4.5 m. Longer references are more accurate, so prefer a bay or a car over a single brick.</p>'
},

{id:'routes',level:'plan',topic:'planner',kind:'planner',minutes:4,
 title:'Route lengths and quantities',
 summary:'Draw cable runs, ducts and trenches that measure and price themselves.',
 kw:'routes measure price budget rates swa duct trench tray trunking legend run notes planner quantities',
 readFirst:['scale'],related:['cable','base','quote-pack'],
 body:'<p>Pick the right route kind (SWA, duct, trench, tray, trunking, data and so on); each carries its own line style, legend entry and spec note. On a scaled photo the length is measured as you draw; snap the ends onto equipment so runs land on the unit or board. The totals card lists the measured lengths for each route type.</p>'
 +'<p>Check the scale and dimensions before using these quantities to order materials. Add run notes from the presets ("2 m spare coiled at charger", "Warning tape 150 mm above duct") so the drawing carries the install detail.</p>'
 +SHOT('guide-routes.jpg','A trench route selected on the plan, with its measured length on the label.')
},

{id:'arrtool',level:'plan',topic:'planner',kind:'planner',minutes:4,
 title:'Model DLM groups and read the load check',
 summary:'Tag chargers into groups, set the limit and see the modelled demand against the supply.',
 kw:'model dlm groups load check tag letter board limit cloud wired rcbo ways planner headroom',
 readFirst:['dlm-plain','scale'],related:['array','md'],
 body:'<p>Tag each charger with a DLM group letter (A, B, C) in its properties; any mix of 7, 11 and 22 kW. For wired DLM, place a load management board with the same letter and set its phase and limit; the board panel allocates RCBO ways and warns when sockets would queue. For cloud DLM, switch the group to Cloud in the charger panel and set its limit; no board or data cabling on the plan.</p>'
 +'<p>The Supply load check card then counts each group at its limit instead of full rate per socket, to show the modelled charger demand. Confirm the available capacity and load-control design before making a supply application.</p>'
},

{id:'planner-markup-tools',level:'plan',topic:'planner',kind:'planner',minutes:5,
 title:'The Markup page: tools, panels and the Technical menu',
 summary:'What each part of the drawing page does and where the technical helpers live.',
 kw:'markup page tools equipment picker bay tool label stamp technical menu single line diagram cable calculations charging simulator materials list display options focus',
 readFirst:['planner-first-project'],related:['scale','routes','arrtool'],
 body:'<ul><li><b>Tool strip:</b> undo and redo, Select, the route tools, the Bay tool and the equipment categories. The active tool is marked in lime.</li>'
 +'<li><b>Equipment picker:</b> chargers, boards, meters, site and safety kit, with search, favourites and recently placed items. Place another like this keeps the chosen configuration.</li>'
 +'<li><b>Panel:</b> Plans &amp; settings for the project and its photos; Selected item for the thing you have tapped (label, model, rating, DLM group, mounting, appearance).</li>'
 +'<li><b>Checks tab:</b> the supply load check, readiness, survey photo checklist and compliance items.</li>'
 +'<li><b>Technical menu:</b> single-line diagram, cable calculations, charging simulator, DNO application data, materials list, earthing and protection wizard, CDM project controls and the PDF page import.</li>'
 +'<li><b>Display options:</b> labels, legend, equipment view (side-on, overhead, 3D) and the evidence overlay.</li>'
 +'<li><b>Focus:</b> hides the panels to give the drawing the whole screen; useful on a phone.</li></ul>'
 +SHOT('guide-technical.jpg','The Technical menu on the Markup page.')
},

{id:'planner-pages',level:'plan',topic:'planner',kind:'planner',minutes:5,
 title:'Design lab, Programme, Snags and Review & issue',
 summary:'What the four project pages are for and how they feed the documents.',
 kw:'design lab programme snags snag register review issue pages overview evidence compare options scenario phases revisions documents pdf',
 readFirst:['planner-first-project'],related:['planner-markup-tools','quote-pack'],
 body:'<h4>Design lab</h4><p>Keeps the survey evidence (measured, assumed or missing), saves design options to compare quantities and cost, estimates the impact of a change, runs a charging-day scenario, plans phased expansion and keeps immutable revisions with a review register for an independent check.</p>'
 +SHOT('guide-design-lab.jpg','Design lab: evidence status and the next survey action.')
 +'<h4>Programme</h4><p>A list of activities with owners, dates and progress, shown on a timeline. Add suggestions from the markup to start from what is drawn. The programme PDF comes from here.</p>'
 +'<h4>Snags</h4><p>Numbered snag markers on the plan become a register with severity, who fixes it, target dates and before-and-after photos. Sign it off and it prints as a rectification list with the pins visible.</p>'
 +SHOT('guide-snags.jpg','Snag register with findings linked to the plan.')
 +'<h4>Review &amp; issue</h4><p>Choose a document, review the preview and download the PDF: marked-up plans, engineer pack, client pack, programme, snag report and the schedules.</p>'
},

/* ───────── Level 3 · Installing ───────── */
{id:'survey-checklist',level:'install',topic:'basics',kind:'sheet',minutes:3,art:'survey-photo',print:true,
 title:'Site survey checklist',
 summary:'A one-page list to work through on site, with the photos to take at each point.',
 kw:'survey checklist cheat sheet printable photos cut out meter board earthing route bays signal access one page',
 readFirst:['survey-basics'],related:['cert','md','earthsys'],
 body:'<div class="g-sheet"><h4>Supply</h4><ul class="g-check">'
 +'<li>Cut-out and main fuse rating, label legible <em>photo</em></li><li>Looped service? Yes / No / Unknown</li><li>Meter type; CT metered? Half-hourly data requested</li><li>Earthing arrangement: TN-C-S / TN-S / TT <em>photo of earthing conductor and label</em></li><li>Tails size and condition; main switch rating</li><li>Agreed capacity (kVA) on commercial sites</li></ul>'
 +'<h4>Distribution</h4><ul class="g-check"><li>Board location, spare ways, condition <em>photo</em></li><li>Existing SPD? RCD types in use</li><li>Space for a new EV board near the chargers</li><li>Existing maximum demand (data or logger)</li></ul>'
 +'<h4>Route</h4><ul class="g-check"><li>Route from board to each charger, measured <em>photos along the route</em></li><li>Crossings: roads, paths, walls, other services</li><li>Surface types for reinstatement</li><li>Buried services drawings requested; CAT scan planned</li><li>Asbestos register checked for buildings pre-2000</li></ul>'
 +'<h4>Chargers and bays</h4><ul class="g-check"><li>Charger positions, mounting (wall or post), lead reach to each bay</li><li>Bay sizes; accessible bays and transfer zones</li><li>Vehicle protection: wheel stops, bollards</li><li>Lighting at night; sign positions</li></ul>'
 +'<h4>Connectivity</h4><ul class="g-check"><li>Mobile signal at each charger position</li><li>Wi-Fi reach and network owner</li><li>Ethernet available?</li></ul>'
 +'<h4>Site and people</h4><ul class="g-check"><li>Access for van and plant; working hours</li><li>Welfare arrangements</li><li>Landlord or planning consents needed</li><li>Public use intended? (public charging rules apply)</li><li>Who signs off: client contact, principal contractor</li></ul></div>'
 +TIP('the Checks tab carries this list as the survey photo checklist. Start site walk captures the shots in order and names each photo for you.')
},

{id:'prot',level:'install',topic:'power',kind:'howto',minutes:6,art:'protection',course:['dom',3],
 title:'Pick the right protective device for each charger',
 summary:'Typical RCBO and MCB choices per charger type, and what is not accepted.',
 kw:'pick the right protective device rcbo mcb breaker 40a 20a type a c curve double pole 4 pole twin c63 c80 dlm 11kw protection cable table',
 readFirst:['supply-basics'],related:['rcd','radial','cable','afdd'],
 body:'<p>Every AC charger gets its own '+D('radial','dedicated radial')+' with its own protective device. The device must switch all live conductors, be lockable or isolatable, and be labelled ("EV charger" plus the circuit reference). Typical commercial requirements:</p>'
 +ART('protection')
 +'<table class="g-table"><thead><tr><th>Charger</th><th>Protection</th><th>Cable</th></tr></thead><tbody>'
 +'<tr><td>7 kW · single socket</td><td>40 A double-pole '+D('rcbo','RCBO')+' · Type A · 30 mA · C-curve</td><td>6 to 16 mm² 3-core</td></tr>'
 +'<tr><td>11 kW · single socket</td><td>20 A 4-pole RCBO · Type A · 30 mA · 16 A per phase</td><td>5-core</td></tr>'
 +'<tr><td>22 kW · single socket</td><td>40 A 4-pole RCBO · Type A · 30 mA · switches all poles</td><td>6 to 16 mm² 5-core</td></tr>'
 +'<tr><td>Twin · 7 kW per socket</td><td>2 × C40 3-pole MCB (polyphase) or C63/C80 (64 A single-phase)</td><td>6 to 25 mm²</td></tr>'
 +'<tr><td>Twin · 11 kW per socket</td><td>2 × C20 3-pole MCB · 16 A per phase per socket</td><td>5-core</td></tr>'
 +'<tr><td>Twin · 22 kW per socket</td><td>C63/C80 3-pole MCB, or 2 × C40 3-pole</td><td>6 to 25 mm²</td></tr>'
 +'<tr><td>Wired DLM group</td><td>MCCB, switch-fuse or MCB at the group limit upstream · per-charger RCBOs live inside the load management board</td><td>6 to 16 mm² per radial</td></tr>'
 +'<tr><td>Cloud DLM group</td><td>Standard per-charger protection as above; no extra hardware, balancing happens over the internet</td><td>as above</td></tr>'
 +'</tbody></table>'
 +'<p>Where an '+D('mcb','MCB')+' (not an RCBO) is listed, the 30 mA RCD function must come from per-socket RCDs inside the unit, a feature of some models only; confirm on the data sheet before dropping the RCBO. <b class="g-no">Not accepted:</b> Type AC devices, single-pole switching, shared protection between chargers, or devices rated above the manufacturer\'s stated maximum.</p>'
 +TIP('select any charger and the properties panel shows this supply and protection line for its exact variant, power, DLM group and manual cap.')
},

{id:'cable',level:'install',topic:'cable',kind:'howto',minutes:5,course:['dom',3],
 title:'Select and size charger cables',
 summary:'Cable type, size, cores and the volt drop check for every charger run.',
 kw:'cable selection sizing swa ev grade 6mm 16mm 25mm cores cpc armour gland volt drop twin and earth',
 readFirst:['prot'],related:['voltdrop','term','routes'],
 body:'<ul><li><b>Type:</b> '+D('swa','SWA')+' or an EV-grade composite cable. Twin and earth is not acceptable for external charger circuits.</li>'
 +'<li><b>Size:</b> typically 6 to 16 mm² for single-socket units (25 mm² for twins), driven by load, installation reference method, run length and volt drop. Do the calculation and keep it on file.</li>'
 +'<li><b>Cores:</b> line(s), neutral and a dedicated CPC core. SWA armour is earthed at the supply end through a proper SWA gland, but the armour can never be the sole CPC.</li>'
 +'<li><b>Volt drop:</b> long car park runs can have significant '+D('vd','voltage drop')+'; check against the 5 % limit at full 32 A load before committing to a route. The calculator is in '+G('voltdrop','Volt drop and de-rating')+'.</li></ul>'
 +TIP('draw the SWA route and set its measured length; the length is used in the route totals and cable calculations.')
},

{id:'term',level:'install',topic:'cable',kind:'howto',minutes:3,course:['com',1],
 title:'Termination, spares and passive circuits',
 summary:'Spare cable, labelling, and how to leave future-use circuits so they are certified and usable.',
 kw:'termination spare 2m coiled labelling passive circuits adaptable box wago draft eic loop',
 readFirst:['cable'],related:['cert','choose-chargers'],
 body:'<ul><li>Leave at least 2 m of cable coiled at every charger position, ready for the unit termination.</li>'
 +'<li>One cable per unit; no loop-in and loop-out between chargers.</li>'
 +'<li>Label every cable at both ends with its circuit reference: fixed, legible, weatherproof.</li>'
 +'<li><b>Passive (future-use) circuits:</b> terminate into an adaptable box with maintenance-free connectors, label "Passive" with the circuit number, test them, and record them on the draft '+D('eic','EIC')+'. Untested passive runs get excluded from certification and stall future expansion.</li></ul>'
},

{id:'base',level:'install',topic:'civils',kind:'howto',minutes:5,art:'base',course:['com',4],
 title:'Concrete bases and cable ducts',
 summary:'Base and duct dimensions, depths, bends, warning tape and the photo before surfacing.',
 kw:'concrete base ducting 600 400 c20 cured duct 63mm twin wall 450 depth roadway warning tape photograph surfacing tarmac block paving',
 readFirst:['where-chargers-go'],related:['cdm','cert','routes'],
 body:ART('base')
 +'<ul><li><b>Base:</b> 600 × 600 × 400 mm, C20 concrete or stronger, flat and flush with the finished surface (450 × 450 is often accepted for a single-post unit). One per charger, fully cured before install day; no exceptions.</li>'
 +'<li><b>Duct:</b> 63 mm twin-wall (63 to 110 mm for twins), centred through the base and finishing flush; at least 450 mm deep in general areas, at least 600 mm under roadways; bend radius at least 450 mm, entering the base vertically; watertight at every entry.</li>'
 +'<li>Warning tape 150 mm above the duct, plus a pull cord.</li>'
 +'<li>Photograph the bare base before any surface finish is laid. Tarmac over it is fine afterwards; block paving is conditional and the fixing risk sits with whoever laid it.</li></ul>'
 +TIP('pedestal chargers draw their concrete pad automatically; duct routes carry the depth spec in the legend, and "Concrete base, before surfacing" is a one-tap photo name.')
},

{id:'earthsys',level:'install',topic:'earth',kind:'reference',minutes:5,art:'earthing',course:['dom',2],
 title:'TN-C-S, TN-S and TT: what changes on site',
 summary:'How each earthing arrangement affects a charging installation, and the TT conditions.',
 kw:'earthing tn-c-s pme tn-s tt earth systems electrode 200 ohm type b touch potential 2.5m rod',
 readFirst:['supply-basics'],related:['openpen','rcd','earthrod'],
 body:ART('earthing')
 +'<ul><li><b>'+D('pme','TN-C-S (PME)')+'</b> The common case. Units with built-in open-PEN detection (most current models; verify on the data sheet) handle the PEN-fault risk: no separate earth electrode and no extra O-PEN device.</li>'
 +'<li><b>'+D('tns','TN-S')+'</b> Fully supported, but confirm it is a genuine separate-earth supply (private transformer), not a PME conversion. If in doubt, treat as PME.</li>'
 +'<li><b>'+D('tt','TT')+', conditional</b> Only where no TN system is available. Typical conditions: Type B 100 to 300 mA RCD at source · electrode resistance under 200 Ω · at least 16 mm² green-and-yellow from the electrode · rod within 5 m, mechanically protected, no tape clamps.</li></ul>'
 +'<p><b>Touch potential on TT:</b> keep other mains-powered street equipment (lamp columns, powered bollards, gates) at least 2.5 m from the charger unless it shares the same earthing system. This does not apply to TN systems.</p>'
 +TIP('record the earthing arrangement in Job details; pick TT and the panel reminds you of the source-RCD, electrode and 2.5 m clearance rules.')
},

{id:'earthrod',level:'install',topic:'earth',kind:'howto',minutes:3,
 title:'Installing a TT earth electrode',
 summary:'Rod, clamp, pit and test values when a charger circuit is converted to TT.',
 kw:'earth rod electrode tt install inspection pit clamp 200 ohm test 5m street furniture',
 readFirst:['earthsys'],related:['openpen','earthsys'],
 body:'<ul><li>Reading under 200 Ω (lower is better; the design value is set by RA × IΔn ≤ 50 V). Test after driving the rod and record the figure.</li>'
 +'<li>Rod within about 5 m of the charger, in an inspection pit, with a proper rod clamp: no tape clamps.</li>'
 +'<li>At least 16 mm² green-and-yellow from the electrode, mechanically protected.</li>'
 +'<li>Keep chargers 2.5 m clear of street furniture on a different earthing system.</li>'
 +'<li>Keep the electrode separate from PME-bonded metalwork, and consider seasonal change in electrode resistance.</li></ul>'
},

{id:'array',level:'install',topic:'load',kind:'howto',minutes:7,course:['com',2],
 title:'Set up dynamic load management (DLM)',
 summary:'Wired and cloud DLM, how many sockets a group limit supports, and commissioning rules.',
 kw:'dynamic load management dlm group wired cloud ocpp internet limit amps controller de-rate 6a floor queue sub-main manual adjust cap 7 11 22 kw brand model manufacturer',
 readFirst:['dlm-plain','prot'],related:['data','arrtool','limiter'],
 body:'<p>'+D('dlm','DLM')+' runs a group of chargers inside one supply limit: the system watches demand and de-rates active units in real time to control demand against the configured limit. Exactly how it behaves is set by the charger brand: typically any mix of 7, 11 and 22 kW AC units from one manufacturer\'s range can join a group, each keeps charging down to about a 6 A minimum, and below that units queue until capacity frees up. Two ways to build it:</p>'
 +'<ul><li><b>Wired DLM.</b> A load management board or controller with a CT or meter on the incoming supply, and a screened data cable run to every charger (daisy-chain or star, per the manufacturer). Fastest response, and keeps balancing even if the internet goes down. Per-charger RCBOs live in the board.</li>'
 +'<li><b>Cloud DLM.</b> No data cable and no board: the back office balances the group over the internet ('+D('ocpp','OCPP')+' smart-charging profiles). Every unit needs reliable connectivity (whichever of Ethernet, Wi-Fi or 4G it supports), and most systems fall back to a safe preset rate if the connection drops; confirm the offline behaviour. Standard per-charger protection at the source board.</li></ul>'
 +'<table class="g-table"><thead><tr><th>Group limit</th><th>Max active sockets · ~6 A floor</th><th>Keeps ≥16 A each</th></tr></thead><tbody><tr><td>40 A</td><td>6</td><td>2</td></tr><tr><td>60 A</td><td>10</td><td>3</td></tr><tr><td>80 A</td><td>13</td><td>5</td></tr><tr><td>100 A</td><td>16</td><td>6</td></tr></tbody></table>'
 +CALC('dlm-fit')
 +WARN('<b>Varies by brand and model:</b> DLM is proprietary. Group size, mixing rules, the minimum floor, offline fallback and remote adjustment all differ between manufacturers, and a group normally needs chargers from one brand (or a back office that supports them all). The figures above are typical; design from the manufacturer\'s current documentation.')
 +'<ul><li>Limits are per phase: a three-phase group serves three times the sockets, and three-phase (11 and 22 kW) units are balanced on every phase.</li>'
 +'<li>Set the group limit at commissioning, slightly below the fuse or agreed capacity, never at it. On most systems it stays manually adjustable (on site or remotely) as the site\'s needs change.</li>'
 +'<li>Many systems also let individual chargers be manually capped, for example one unit held at 16 A on a tight corner of the site.</li>'
 +'<li>Sub-main and switchgear are sized to the full group limit; no diversity.</li></ul>'
 +TIP('tag chargers A, B or C, then either place a load management board with the matching letter (wired) or switch the group to Cloud in the charger panel and set its limit. The load check caps the group at that limit.')
},

{id:'limiter',level:'install',topic:'load',kind:'reference',minutes:3,course:['dom',1],
 title:'CT-clamp load limiting for tight supplies',
 summary:'How a load limiter keeps a single charger inside a small main fuse.',
 kw:'ct clamp load limiter fuse threshold 6a minimum output single charger tight supply brand model manufacturer',
 readFirst:['dlm-plain'],related:['md','array'],
 body:'<p>A '+D('ct','CT clamp')+' measures incoming demand so compatible equipment can reduce or pause charging at a configured limit. Charging can resume as demand falls. Confirm the charger, vehicle and controller behaviour, including the minimum current and response to lost communications. Follow the manufacturer\'s instructions for clamp positions, data cabling and configuration. For multiple chargers, assess how the group will share the available capacity.</p>'
 +'<p>Clamp the CT around the incoming line conductor, usually at the meter tails, and keep the sensor cable radial, never daisy-chained.</p>'
},

{id:'cert',level:'install',topic:'process',kind:'howto',minutes:4,course:['dom',4],
 title:'Certificates and installation photos',
 summary:'The EIC, Part P, and the photo record that proves what is now buried or boxed in.',
 kw:'certification eic photo record photos part p schedules test results sign-off grant evidence',
 readFirst:['survey-checklist'],related:['commissioning','grants-paperwork','term'],
 body:'<ul><li>'+D('eic','EIC')+' (with schedules of inspection and test results) for every new circuit; issue a draft covering passive circuits too. Domestic work also needs '+D('partp','Part P')+' notification via a competent-person scheme.</li>'
 +'<li><b>Photograph as you go:</b> cut-out and supply head with ratings legible, protection devices in the board, cable runs and glands, the coiled 2 m spare, and the bare concrete base before surfacing.</li>'
 +'<li><b>Share before sign-off:</b> if a client, principal contractor or charger supplier has to approve the works, send photos and draft certificates ahead of the visit. Surprises on the day become revisits.</li>'
 +'<li>Photograph bases and cable routes before they are covered. Keep the images with the inspection and test records.</li></ul>'
 +TIP('the photo rename chips cover this record ("Circuit protection close-up", "Concrete base, before surfacing" and so on), and the compliance checklist card tracks the paperwork per job.')
},

{id:'commissioning',level:'install',topic:'process',kind:'howto',minutes:5,
 title:'Commissioning and handover',
 summary:'Tests, the charger\'s own checks, app set-up and what to leave with the customer.',
 kw:'commissioning handover test sequence zs insulation rcd test evse tester adaptor app setup schedule off peak isolation customer pack warranty',
 readFirst:['cert'],related:['comms','pcpr','quote-pack'],
 body:'<h4>Before energising</h4><ul><li>Continuity, insulation resistance, polarity and '+D('zs','earth fault loop impedance')+' on every new circuit, recorded on the schedule.</li><li>RCD trip tests at the rated residual current and at five times it; confirm the device type matches the design.</li><li>Open-PEN detection confirmed for the unit, or the TT electrode tested.</li></ul>'
 +'<h4>The charger</h4><ul><li>Run the unit\'s own commissioning sequence and a full start-and-stop cycle with an EV test adaptor or a car, including a simulated fault.</li><li>Confirm the unit is online and registered to the back office; an offline charger fails commissioning under the smart regulations.</li><li>Set the load management group limit or the load limiter threshold slightly below the fuse, and record it.</li><li>Set the off-peak schedule to suit the customer\'s tariff; keep the random delay and security settings the regulations require.</li></ul>'
 +'<h4>Handover</h4><ul><li>Set the app up on the customer\'s phone, not yours.</li><li>Show the isolation point and what the status lights mean, so they can tell a paused charge from a fault.</li><li>Leave the pack: EIC, manufacturer registration and warranty, DNO notification confirmation, the smart compliance statement and, for public sites, the helpline and tariff details on display.</li><li>Photograph the finished install: position, cable dressing, labels, signed and lit bays.</li></ul>'
 +TIP('the Snag register records anything left to put right, and Review &amp; issue collects the handover documents.')
},

/* ───────── Level 4 · Advanced design ───────── */
{id:'radial',level:'advanced',topic:'power',kind:'reference',minutes:3,course:['com',1],
 title:'Dedicated radials: why there is no diversity on charging',
 summary:'Each charging point is a continuous full-load appliance, so the design counts every socket at full current.',
 kw:'dedicated radial diversity no shared protection evdb full load continuous 32a loop',
 readFirst:['prot'],related:['md','array','prot'],
 body:'<p>Each charging point is a continuous full-load appliance: a 7 kW socket draws 32 A for hours at a time. BS 7671 Section 722 requires design at full rated current. You cannot apply '+D('diversity')+' factors to EV circuits, and chargers must never share a protective device or loop from one unit to the next.</p>'
 +'<ul><li>One radial, one protective device, one cable per charger (per socket on back-to-back posts).</li>'
 +'<li>An '+D('evdb','EV distribution board (EVDB)')+' close to the chargers keeps radials short and allows space for later additions.</li>'
 +'<li>If the sums do not fit the supply, the answer is '+D('dlm','dynamic load management')+' (wired or cloud) or a supply upgrade, never diversity.</li></ul>'
},

{id:'rcd',level:'advanced',topic:'power',kind:'reference',minutes:5,art:'rcd',course:['dom',3],
 title:'Type A vs Type B RCDs, and the 6 mA DC rule',
 summary:'Why smooth DC blinds an ordinary RCD, and which combination of device and charger satisfies Section 722.',
 kw:'type a vs type b rcd 6ma dc detection rdc-dd residual current 722 30ma blinding type ac iec 62955',
 readFirst:['prot'],related:['openpen','earthsys','afdd'],
 body:'<p>EV charging can leak smooth DC fault current, which blinds an ordinary RCD. '+D('bs7671','BS 7671')+' Section 722 therefore requires each charging point to have both 30 mA RCD protection <b>and</b> protection against DC fault current above 6 mA. That second part can come from:</p>'
 +ART('rcd')
 +'<ul><li><b>'+D('rdcdd','RDC-DD')+' built into the charger</b> (most current units, but not all; verify on the data sheet). A <b>Type A</b> RCD or RCBO upstream is then sufficient and is the normal commercial arrangement. Amendment 4 references RDC-DD to IEC 62955.</li>'
 +'<li><b>A Type B RCD</b> at the origin of the circuit. Required only where the charger has no built-in DC detection, or on TT systems where the source RCD is specified as Type B (100 to 300 mA).</li></ul>'
 +'<p><b class="g-no">Type AC devices are never acceptable</b> for EV circuits. Do not stack a Type B downstream of a Type A: DC blinding works in the other direction; check discrimination with the designer.</p>'
},

{id:'openpen',level:'advanced',topic:'earth',kind:'reference',minutes:5,art:'penFault',course:['dom',2],
 title:'Open-PEN protection without an earth rod',
 summary:'What a broken PEN does, and the compliant options under 722.411.4.1.',
 kw:'open pen protection o-pen opdd earth rod pen fault 722.411 broken neutral pme detection device voltage monitoring',
 readFirst:['earthsys'],related:['earthrod','rcd'],
 body:'<p>On a '+D('pme','PME')+' supply, a broken '+D('pen','PEN conductor')+' can put mains voltage on everything earthed, including a car on charge outdoors. BS 7671 (722.411.4.1) gives several compliant answers; in practice you will use one of:</p>'
 +ART('penFault')
 +'<ul><li><b>Built-in open-PEN detection</b> in the charger (a voltage-monitoring device to the device standard). Common on current commercial units but not universal. Where the data sheet confirms it, nothing extra to install.</li>'
 +'<li><b>A separate '+D('opdd','open-PEN device (OPDD)')+'</b> ahead of a charger that lacks it.</li>'
 +'<li><b>Convert the circuit to '+D('tt','TT')+'</b> with an earth electrode; the design must meet the TT requirements in '+G('earthsys','the earthing guide')+' and '+G('earthrod','the electrode guide')+'.</li></ul>'
 +WARN('<b>Do not double up.</b> If the unit already has O-PEN detection, an extra upstream O-PEN device is unnecessary and can cause commissioning failures. Check the data sheet, then leave it out.')
},

{id:'voltdrop',level:'advanced',topic:'cable',kind:'howto',minutes:6,art:'voltdrop',
 title:'Volt drop and de-rating',
 summary:'The full single-circuit check for a charger run, with a volt drop calculator.',
 kw:'volt drop voltage drop calculator mv/a/m 5% derating grouping ambient thermal insulation ib in iz zs cable size long run',
 readFirst:['cable'],related:['prot','three-phase','routes'],
 body:ART('voltdrop')
 +'<p>Each sized run gets the full single-circuit check:</p><ol>'
 +'<li><b>Device covers the load:</b> Ib ≤ In. A 7 kW socket is 32 A, so a 40 A device.</li>'
 +'<li><b>Cable carries the device after de-rating:</b> In ≤ Iz. Apply the correction factors for ambient temperature, grouping with other circuits, thermal insulation and burial conditions before comparing.</li>'
 +'<li><b>'+D('vd','Volt drop')+' under 5 %</b> at full charger load: 11.5 V on 230 V, 20 V on 400 V. Long car park runs are usually sized by this step, not by current.</li>'
 +'<li><b>Earth fault loop ('+D('zs','Zs')+')</b> inside the device limit, so it disconnects in time.</li>'
 +'<li><b>CPC size</b> against fault energy (the adiabatic check), or the tabulated minimum.</li></ol>'
 +'<h4>Try it</h4>'+CALC('voltdrop')
 +'<p>Draft ratings data; verify against BS 7671 Appendix 4 and the cable manufacturer\'s tables before construction. Where a run fails, the usual fixes are a larger cable, a shorter route or an '+D('evdb','EVDB')+' nearer the chargers.</p>'
 +TIP('the cable calculations sheet in the Technical menu runs this check for every measured route on the plan.')
},

{id:'three-phase',level:'advanced',topic:'power',kind:'reference',minutes:4,art:'threePhase',
 title:'Balancing three-phase supplies',
 summary:'Spreading single-phase chargers across L1, L2 and L3, and how three-phase units and DLM groups fit in.',
 kw:'three phase balance balancing l1 l2 l3 single phase chargers spread rotate phases unbalance neutral current 11kw 22kw',
 readFirst:['supply-basics','prot'],related:['array','md','voltdrop'],
 body:ART('threePhase')
 +'<ul><li>A three-phase supply is three single-phase supplies sharing a neutral. Its limit is per phase, so four 7 kW chargers all on L1 overload L1 while L2 and L3 sit idle.</li>'
 +'<li><b>Spread single-phase chargers</b> across the phases as evenly as the count allows, and rotate the phase along a run of posts. Record which phase each circuit is on.</li>'
 +'<li><b>Three-phase chargers</b> (11 and 22 kW) draw from all three phases and balance themselves; a mixed group needs the single-phase units spread.</li>'
 +'<li><b>Load management</b> limits are per phase. A wired board allocates its ways across the phases; check the manufacturer\'s rules on which phase each unit sits.</li>'
 +'<li>Heavy unbalance raises neutral current and voltage differences between phases; include it in the maximum demand assessment.</li></ul>'
 +TIP('set the phase on each load management board and supply item; the board panel allocates ways and the load check reports per-phase demand.')
},

{id:'spd',level:'advanced',topic:'power',kind:'reference',minutes:3,
 title:'Surge protection on EV boards',
 summary:'Where a Type 2 SPD goes, when a Type 1 is needed and what to record.',
 kw:'surge protection spd type 2 type 1 transient amendment risk assessment lightning',
 readFirst:['prot'],related:['afdd','regs'],
 body:'<p>Since Amendment 2 (2022), BS 7671 expects surge protection in most new installations unless a documented risk assessment says otherwise. For EV work the practical rule: fit a <b>Type 2 '+D('spd','SPD')+'</b> in the EVDB or at the origin of the new charging circuits (a Type 1 is also acceptable at the origin on TN-S, and is needed where the building has a lightning protection system). Chargers are outdoor electronics on long cable runs; check their surge protection requirements during design.</p>'
 +'<p>Photograph the SPD with its status window visible for the job\'s photo record, and note it on the EIC.</p>'
},

{id:'afdd',level:'advanced',topic:'power',kind:'reference',minutes:4,
 title:'AFDD on EV circuits: decide and record',
 summary:'Where arc fault detection is mandatory, where it is a judgement, and how to record either outcome.',
 kw:'afdd arc fault detection device a4 2026 premises hrrb hmo student care home risk assessment record decision 32a rcbo combined loose termination',
 readFirst:['prot'],related:['rcd','regs'],
 body:'<p>An '+D('afdd','AFDD')+' trips on the arc signature of a damaged cable or loose termination, faults an RCD and MCB both miss. BS 7671:2018+A4:2026 extends where arc fault protection is expected, and EV final circuits are squarely in scope for the assessment.</p>'
 +'<ul><li><b>Mandatory list first:</b> higher-risk residential buildings, HMOs, purpose-built student accommodation and care homes require AFDDs on 32 A socket circuits; an EV radial qualifies. Elsewhere the requirement is a documented judgement, not silence.</li>'
 +'<li><b>Fitting one:</b> a combined AFDD/RCBO (Type A, 30 mA) in the way feeding the charger reduces the space needed in the board; check coordination with the charger\'s RDC-DD against the manufacturer\'s device list.</li>'
 +'<li><b>Record the decision either way</b> on the EIC or design record: "assessed, required and fitted" or "assessed, not required for this premises type". Keep the decision with the inspection records.</li></ul>'
 +'<p>Check the device dimensions and cost during design so the board schedule, quotation and drawing agree.</p>'
},

{id:'data',level:'advanced',topic:'cable',kind:'reference',minutes:4,course:['com',2],
 title:'Data cables for load management',
 summary:'Wired DLM and CT limiter cabling, cloud alternatives and future provision.',
 kw:'data cable load management 4 core lszh shielded ct clamp daisy chain star cluster future proofing cloud wired dlm internet no cable brand model manufacturer',
 readFirst:['array'],related:['comms','term'],
 body:'<ul><li><b>Cloud DLM:</b> no data cabling at all; each charger just needs reliable internet over whichever of Ethernet, Wi-Fi or 4G the unit actually supports (not every model offers all three). Most systems fall back to a safe preset rate if the connection drops; confirm the offline behaviour for the brand.</li>'
 +'<li><b>Spec (wired):</b> typically 4-core LSZH shielded data cable, screened to 600 V when run alongside LV power. Heavier gauge on runs over about 60 m. 2 m spare both ends. The manufacturer\'s spec governs; check it before ordering.</li>'
 +'<li><b>CT limiter:</b> one data cable per charger and per phase, radial only; never daisy-chained.</li>'
 +'<li><b>Wired DLM:</b> data links the board or controller to every charger, daisy-chained, star-wired or mixed per the manufacturer\'s topology; keep clusters on different phases on separate data runs.</li>'
 +'<li><b>Future provision:</b> pulling data alongside every power cable today (terminated, labelled "Passive, future load management", on the draft EIC) means moving to wired DLM later needs no re-trenching. Or skip it and plan for cloud DLM.</li></ul>'
},

{id:'regs',level:'advanced',topic:'process',kind:'reference',minutes:6,course:['dom',4],
 title:'Installation regulations and standards',
 summary:'BS 7671 Amendment 4, the IET Code of Practice, the smart and public regulations, Part S, PAS 1899 and grants.',
 kw:'2026 rulebook bs 7671 amendment 4 18th edition orange book iet code of practice 5th smart charge point regulations part s public charge point grants wcs 500 pas 1899 afdd v2g',
 readFirst:['rules-plain'],related:['pcpr','cdm','afdd'],
 body:'<ul><li><b>'+D('bs7671','BS 7671')+' (18th Edition):</b> Amendment 4 ("Orange Book") was published 15 April 2026; the previous version (+A2:2022+A3:2024) is withdrawn on 15 October 2026, after which new work certifies to A4. Check which edition your certification software and designs cite. Section 722 is the EV chapter.</li>'
 +'<li><b>What A4:2026 changed for EV work:</b> Section 722 gains provisions for bidirectional charging (V2G/V2H) and export-capable units; 6 mA DC fault detection for Mode 3 now references RDC-DD to IEC 62955 (not just Type B RCDs); AFDD requirements extend to more premises including EV charging circuits; and a new Chapter 57 covers battery storage that increasingly shares the board with chargers. Schemes also now expect each person doing EV work to hold their own Level 3 qualification.</li>'
 +'<li><b>'+D('cop','IET Code of Practice')+' for EV Charging Equipment Installation, 5th Edition (2023):</b> the practical companion to Section 722, aligned with ENA G12/4. Covers PAS 1899 accessibility, RC59 fire safety guidance, V2G and prosumer installs, buried-cable depths and telecoms and auxiliary cabling.</li>'
 +'<li><b>'+D('smart','Smart Charge Points Regulations 2021')+':</b> private chargers up to 50 kW sold since 30 June 2022 must be smart, with default off-peak schedules, randomised delay and security requirements.</li>'
 +'<li><b>'+D('parts','Building Regs Part S')+' (England):</b> new homes and buildings with parking need chargepoints from the outset: at least Mode 3, 7 kW or more, universal socket, on a dedicated circuit.</li>'
 +'<li><b>'+D('pcpr','Public Charge Point Regulations 2023')+':</b> consumer duties if your chargers serve the public; see '+G('pcpr','the dedicated guide')+'.</li>'
 +'<li><b>'+D('pas1899','PAS 1899:2022')+':</b> the accessible-charging specification: bay dimensions, clear access zones, charger reach and interface heights.</li>'
 +'<li><b>Grants:</b> the '+D('wcs','Workplace Charging Scheme')+' runs until 31 March 2027: up to £500 per socket (75 % of costs, max 40 sockets per applicant) for installs completed from 1 April 2026, via OZEV-authorised installers.</li></ul>'
},

{id:'pcpr',level:'advanced',topic:'process',kind:'reference',minutes:5,course:['com',6],
 title:'Public charging sites: the consumer-facing rules',
 summary:'Pricing, contactless payment, helpline, open data, reliability and roaming duties for public chargers.',
 kw:'public charge point regulations 2023 contactless payment 8kw pricing p/kwh helpline 24/7 ocpi open data 99% reliability rapid roaming opss enforcement consumer public',
 readFirst:['rules-plain'],related:['bays','signage','comms'],
 body:'<p>The '+D('pcpr','Public Charge Point Regulations 2023')+' apply to any charger the general public can use, supermarket and destination car parks included. Private workplace and residential chargers are exempt. All the phase-in deadlines have now passed, so a new public site must meet the lot from day one:</p>'
 +'<ul><li><b>Pricing:</b> the maximum price in p/kWh clearly displayed at the unit, on its screen or in the app before the session starts.</li>'
 +'<li><b>Contactless payment</b> on every new public charger of 8 kW and above (a shared site terminal is acceptable); no app or membership barrier for ad-hoc users.</li>'
 +'<li><b>Free 24/7 staffed helpline</b>, with contact details displayed at the site, plus quarterly performance reporting.</li>'
 +'<li><b>Open data via OCPI:</b> live status, location, connector type and pricing published in machine-readable form.</li>'
 +'<li><b>99 % reliability</b> for rapid (50 kW+) networks, measured as an annual average, published and reported to OPSS.</li>'
 +'<li><b>Roaming:</b> payment through at least one third-party roaming provider (required since November 2025); new agreements reported within 28 days.</li></ul>'
 +'<p>Enforced by the Office for Product Safety and Standards on behalf of OZEV: compliance notices can block further installs, and fines follow. Flag these duties to clients early: the payment terminal, data feed and helpline contract belong in the quote, not the snag list.</p>'
},

{id:'cdm',level:'advanced',topic:'process',kind:'howto',minutes:7,course:['com',6],
 title:'CDM responsibilities and site documents',
 summary:'The construction phase plan, appointments, F10, welfare, RAMS, buried services, public protection and asbestos.',
 kw:'cdm 2015 rams method statement risk assessment construction phase plan cpp f10 notifiable hse principal contractor designer inductions permits cat scan paperwork welfare schedule 2 lsbud heras asbestos',
 readFirst:['rules-plain'],related:['base','survey-checklist','regs'],
 body:'<ul><li>'+D('cdm','CDM 2015')+' applies to construction work, including domestic installs. A proportionate <b>construction phase plan</b> (CPP) must be prepared before construction starts on every project. Where more than one contractor is involved, the commercial client must appoint a principal designer and principal contractor in writing.</li>'
 +'<li><b>Notifiable jobs</b> are those scheduled to last longer than 30 working days with more than 20 workers working simultaneously at any point, or to exceed 500 person-days. For a commercial client, the client must submit the '+D('f10','F10 notification')+' to HSE.</li>'
 +'<li><b>Welfare from day one</b> (CDM Schedule 2): toilet, washing, drinking water and somewhere to rest and eat: a welfare unit or site cabin on site, or the client\'s facilities agreed in writing, never assumed. Agree where the cabin, storage container and skip will stand, and which bays or access they take out, before mobilisation.</li>'
 +'<li><b>'+D('rams','RAMS')+':</b> a site-specific risk assessment and method statement, issued to and accepted by the client or principal contractor before the start date. Name the actual site, tasks, plant and emergency arrangements; the documents must describe the work and hazards at this site.</li>'
 +'<li><b>Buried services:</b> utility drawings obtained (a free LSBUD enquiry covers most), the route CAT and Genny scanned and marked, hand-dig within 500 mm of marked services, and dig, isolation and hot-works permits signed before the first trench is cut.</li>'
 +'<li><b>Public protection:</b> Heras fencing around work areas, open trenches covered or fenced whenever unattended, a signed and lit pedestrian diversion, and banksman control where plant crosses footways.</li>'
 +'<li><b>Asbestos:</b> in any building built or refurbished before 2000, check the asbestos register or survey before drilling or chasing, and stop if suspect material appears.</li>'
 +'<li><b>Emergency arrangements:</b> named first aider and kit on site, an extinguisher at the work area, muster point and nearest A&amp;E in the induction.</li>'
 +'<li><b>Day one:</b> inductions booked and signed, with the paperwork above displayed in the welfare unit.</li></ul>'
 +TIP('open CDM project controls from the Technical menu in a commercial project. Record the client, contractors, appointments, F10 assessment, document register and design-risk decisions. Export the CDM project controls PDF and mark the site arrangements: cabin, storage container, WC and skip, Heras or cone lines, exclusion zones, protected pedestrian routes, inspection pits, spoil, the safety signboard and First aid and Fire point markers.')
}
];

/* Five-question checks at the end of each level. Revision only; not evidence of competence. */
const QUIZ={
 start:[
  {q:'A 22 kW charger is connected to a car whose on-board charger accepts 7 kW. How fast does the car charge?',a:['22 kW','7 kW','About 15 kW'],c:1,why:'The slowest link sets the rate. The car converts AC to DC, so its own limit wins.'},
  {q:'Headroom is:',a:['The height of the charger socket','The supply limit minus the existing maximum demand','The length of the charging lead'],c:1,why:'Limit minus what the building already uses at its busiest is what chargers can use.'},
  {q:'Why does each charger get its own circuit?',a:['It looks tidier','It can run at full load for hours and must not share protection','Chargers use DC'],c:1,why:'Chargers are counted at full load with no diversity and never share a protective device.'},
  {q:'Who owns the cut-out and main fuse?',a:['The homeowner','The installer','The network operator (DNO)'],c:2,why:'The cut-out belongs to the DNO and must never be opened by anyone else.'},
  {q:'Which plug is the UK standard for AC charging?',a:['Type 1','Type 2','CHAdeMO'],c:1,why:'Type 2 is the standard AC connector in the UK and Europe.'}
 ],
 plan:[
  {q:'Cars at a workplace stay all day. The usual charger choice is:',a:['50 kW rapid chargers','7 kW sockets, as many as the supply allows with load management','One 150 kW ultra-rapid'],c:1,why:'Match power to dwell time; all-day parking suits 7 kW.'},
  {q:'A standard EV bay is:',a:['2.4 × 4.8 m','3.6 × 6 m','2 × 4 m'],c:0,why:'2.4 × 4.8 m with EV-only lettering and a strip at the open end.'},
  {q:'Connect-and-notify to the DNO is allowed when:',a:['Any number of chargers is fitted','The ENA criteria all hold, including a single new unit and demand under about 60 A per phase','The client asks for it'],c:1,why:'Otherwise apply first through ENA Connect Direct.'},
  {q:'Load management lets a group of chargers:',a:['Charge faster than their rating','Share a limited supply so the total never exceeds the limit','Work without an RCD'],c:1,why:'Each charger slows as more cars arrive; the total stays under the group limit.'},
  {q:'Most chargers use which Wi-Fi band?',a:['2.4 GHz','5 GHz','6 GHz'],c:0,why:'A dedicated 2.4 GHz network with no captive portal is the safe choice.'}
 ],
 install:[
  {q:'The usual protective device for a 7 kW single socket is:',a:['32 A Type AC RCD','40 A double-pole Type A 30 mA RCBO','16 A MCB'],c:1,why:'Type AC is never acceptable on EV circuits; each charger gets its own RCBO.'},
  {q:'How much spare cable is coiled at each charger position?',a:['None','At least 2 m','At least 10 m'],c:1,why:'2 m spare avoids a re-pull if the unit shifts at fit-off.'},
  {q:'Minimum duct cover under a roadway is:',a:['300 mm','450 mm','600 mm'],c:2,why:'450 mm in general areas, 600 mm under drives and roads.'},
  {q:'On a TT charger circuit the electrode reading should be:',a:['Under 200 Ω','Under 2000 Ω','It does not matter'],c:0,why:'Under 200 Ω, with the rod within about 5 m in an inspection pit.'},
  {q:'The DLM group limit is set:',a:['Exactly at the fuse rating','Slightly below the fuse or agreed capacity','Above the fuse rating'],c:1,why:'Never at the fuse; leave a margin and record the setting.'}
 ],
 advanced:[
  {q:'A charger with built-in RDC-DD needs which upstream RCD type?',a:['Type AC','Type A','Type B is always required'],c:1,why:'Type A with built-in 6 mA DC detection is the normal arrangement; Type B only where the charger lacks it.'},
  {q:'If a charger already has open-PEN detection, an extra upstream O-PEN device is:',a:['Required','Unnecessary and can cause commissioning failures','Required on TN-S only'],c:1,why:'Do not double up. Check the data sheet, then leave it out.'},
  {q:'The volt drop limit for a charger circuit is:',a:['3 %','5 %','10 %'],c:1,why:'5 % for power circuits: 11.5 V on 230 V, 20 V on 400 V.'},
  {q:'Four 7 kW chargers on a three-phase supply should be:',a:['All on L1','Spread across the phases','Connected to the neutral'],c:1,why:'Spread single-phase chargers evenly and record the phase of each circuit.'},
  {q:'From 15 October 2026 new work certifies to:',a:['BS 7671 Amendment 2','BS 7671 Amendment 4','The IET Code of Practice only'],c:1,why:'Amendment 4:2026 applies once the previous version is withdrawn on 15 October 2026.'}
 ]
};

/* ───────── Calculators ───────── */
const VD_TABLE={ /* approximate mV/A/m for 70 °C thermoplastic copper multicore: single-phase, three-phase */
 '2.5':[18,15],'4':[11,9.5],'6':[7.3,6.4],'10':[4.4,3.8],'16':[2.8,2.4],'25':[1.75,1.5],'35':[1.25,1.1]
};
const CALCS={
 'charge-time':{
  title:'Charging time',
  html:'<label>Battery size (kWh)<select data-k="kwh"><option>40</option><option selected>60</option><option>75</option><option>100</option></select></label>'
   +'<label>Charger power (kW)<select data-k="kw"><option>2.3</option><option selected>7</option><option>11</option><option>22</option><option>50</option><option>150</option></select></label>'
   +'<label>From (%)<input type="number" data-k="from" value="20" min="0" max="99"></label><label>To (%)<input type="number" data-k="to" value="80" min="1" max="100"></label>',
  run(v){const need=v.kwh*Math.max(0,v.to-v.from)/100;const eff=v.kw>=50?0.95:0.9;const h=need/(v.kw*eff);const hrs=Math.floor(h),mins=Math.round((h-hrs)*60);
   return '<b>About '+(hrs?hrs+' h ':'')+mins+' min</b> to add '+need.toFixed(0)+' kWh'+(v.kw>=50&&v.to>80?'. DC charging slows above 80 %, so expect longer.':'')+(v.kw>7?'. Only if the car accepts '+v.kw+' kW.':'.');}
 },
 'headroom':{
  title:'Supply headroom',
  html:'<label>Supply limit (A per phase)<input type="number" data-k="limit" value="100" min="1"></label>'
   +'<label>Phases<select data-k="ph"><option value="1" selected>Single</option><option value="3">Three</option></select></label>'
   +'<label>Existing maximum demand (A per phase)<input type="number" data-k="md" value="55" min="0"></label>'
   +'<label>7 kW sockets<input type="number" data-k="n" value="2" min="0" max="60"></label>'
   +'<label>Load management limit (A, 0 for none)<input type="number" data-k="dlm" value="0" min="0"></label>',
  run(v){const room=v.limit-v.md;const perPhase=v.ph===3?Math.ceil(v.n/3):v.n;const load=v.dlm>0?v.dlm:perPhase*32;const ok=load<=room;
   return '<b>Headroom '+room+' A per phase.</b> '+(v.dlm>0?'The group counts at its '+v.dlm+' A limit':v.n+' socket'+(v.n===1?'':'s')+' at 32 A'+(v.ph===3?' spread over three phases':'')+' = '+load+' A')+'. '+(ok?'<span class="g-ok">Fits inside the headroom.</span>':'<span class="g-no">Does not fit.</span> Use load management with a limit of '+Math.max(0,room-2)+' A or less, reduce the count, or ask the DNO about a larger supply.');}
 },
 'voltdrop':{
  title:'Volt drop check',
  html:'<label>Cable size (mm²)<select data-k="sz">'+Object.keys(VD_TABLE).map(k=>'<option'+(k==='6'?' selected':'')+'>'+k+'</option>').join('')+'</select></label>'
   +'<label>Run length (m)<input type="number" data-k="len" value="40" min="1"></label>'
   +'<label>Current (A)<input type="number" data-k="ib" value="32" min="1"></label>'
   +'<label>Supply<select data-k="ph"><option value="1" selected>Single-phase 230 V</option><option value="3">Three-phase 400 V</option></select></label>',
  run(v){const row=VD_TABLE[String(v.sz)]||VD_TABLE['6'];const mv=v.ph===3?row[1]:row[0];const drop=mv*v.ib*v.len/1000;const base=v.ph===3?400:230;const pct=drop/base*100;const ok=pct<=5;
   return '<b>'+drop.toFixed(1)+' V ('+pct.toFixed(1)+' %)</b> using '+mv+' mV/A/m. '+(ok?'<span class="g-ok">Within the 5 % limit.</span>':'<span class="g-no">Over the 5 % limit.</span> Try the next cable size or a shorter route.')+' Approximate tabulated figure; confirm against BS 7671 Appendix 4 for the actual cable and method.';}
 },
 'dlm-fit':{
  title:'How many sockets fit a group limit?',
  html:'<label>Group limit (A per phase)<input type="number" data-k="limit" value="60" min="6"></label>'
   +'<label>Minimum per charger<select data-k="floor"><option value="6" selected>6 A (typical floor)</option><option value="10">10 A</option><option value="16">16 A (useful rate)</option></select></label>'
   +'<label>Phases<select data-k="ph"><option value="1" selected>Single</option><option value="3">Three</option></select></label>',
  run(v){const per=Math.floor(v.limit/v.floor);const total=per*(v.ph===3?3:1);const useful=Math.floor(v.limit/16)*(v.ph===3?3:1);
   return '<b>Up to '+total+' active socket'+(total===1?'':'s')+'</b> at '+v.floor+' A each'+(v.ph===3?' across three phases':'')+'; '+useful+' can keep at least 16 A. Typical figures; the brand\'s own rules decide.';}
 }
};

/* ───────── Progress, saved guides and quiz scores (this browser only) ───────── */
const STORE_KEY='evsp_guides_v1';
function loadStore(){try{const s=JSON.parse(localStorage.getItem(STORE_KEY)||'null');if(s&&typeof s==='object')return{read:s.read||{},saved:Array.isArray(s.saved)?s.saved:[],last:s.last||null,quiz:s.quiz||{},tour:!!s.tour};}catch(_){}return{read:{},saved:[],last:null,quiz:{},tour:false};}
function saveStore(s){try{localStorage.setItem(STORE_KEY,JSON.stringify(s));}catch(_){}}
const progress={
 get:loadStore,
 isRead:id=>!!loadStore().read[id],
 markRead(id,on){const s=loadStore();if(on===false)delete s.read[id];else s.read[id]=new Date().toISOString();saveStore(s);return !!s.read[id];},
 isSaved:id=>loadStore().saved.includes(id),
 toggleSaved(id){const s=loadStore();const i=s.saved.indexOf(id);if(i>=0)s.saved.splice(i,1);else s.saved.push(id);saveStore(s);return i<0;},
 setLast(id){const s=loadStore();s.last=id;saveStore(s);},
 quiz(level,score){const s=loadStore();if(score!==undefined){s.quiz[level]=Math.max(score,s.quiz[level]||0);saveStore(s);}return s.quiz[level]||0;},
 levelCount(level){const ids=GUIDES.filter(g=>g.level===level).map(g=>g.id);const s=loadStore();return{done:ids.filter(id=>s.read[id]).length,total:ids.length};}
};

/* ───────── Rendering ───────── */
const byId=Object.fromEntries(GUIDES.map(g=>[g.id,g]));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const levelOf=id=>LEVELS.find(l=>l.id===id);
const topicLabel=k=>(TOPICS.find(t=>t[0]===k)||['',''])[1];
const DISCLAIMER='The planner assists site design decisions; it does not certify electrical work. Design, test and certify to BS 7671 and the IET Code of Practice for Electric Vehicle Charging Equipment Installation, and follow the manufacturer\'s instructions.';
const chip=(id,cls)=>{const g=byId[id];return g?'<a class="g-chip '+(cls||'')+'" href="#g='+id+'" data-guide="'+id+'"><span class="g-chip-lvl l-'+g.level+'">'+levelOf(g.level).n+'</span>'+esc(g.title)+'</a>':'';};
function artHTML(key){const art=window.EVGuideArt&&window.EVGuideArt[key];return art||'';}
function guideHTML(id,opts){
 opts=opts||{};const g=byId[id];if(!g)return '';const lv=levelOf(g.level);
 let body=g.body.replace(/<figure class="g-art" data-art="([^"]+)"><\/figure>/g,(m,k)=>{const a=artHTML(k);return a?'<figure class="g-art">'+a+'</figure>':'';});
 body=body.replace(/<div class="g-calc" data-calc="([^"]+)"><\/div>/g,(m,k)=>{const c=CALCS[k];if(!c)return '';return '<div class="g-calc" data-calc="'+k+'"><div class="g-calc-head">'+c.title+'</div><div class="g-calc-fields">'+c.html+'</div><div class="g-calc-out" aria-live="polite"></div></div>';});
 const read=progress.isRead(id),saved=progress.isSaved(id);
 const tools=(opts.compact?'':'')+(g.readFirst&&g.readFirst.length?'<div class="g-rel"><span>Read first</span>'+g.readFirst.map(r=>chip(r)).join('')+'</div>':'');
 const related=g.related&&g.related.length?'<div class="g-rel"><span>Related</span>'+g.related.filter(r=>r!==id).map(r=>chip(r)).join('')+'</div>':'';
 const course=g.course?'<a class="g-course" href="Learning Hub.dc.html#c='+g.course[0]+'&l='+g.course[1]+'">Covered in '+(g.course[0]==='dom'?'Course 01':'Course 02')+' · Lesson '+(g.course[1]+1)+' ↗</a>':'';
 const foot=(g.level==='install'||g.level==='advanced')?'<p class="g-disclaimer">'+DISCLAIMER+'</p>':'';
 const actions='<div class="g-actions"><button type="button" class="g-btn'+(read?' on':'')+'" data-guide-read="'+id+'" aria-pressed="'+read+'">'+(read?'✓ Read':'Mark as read')+'</button><button type="button" class="g-btn'+(saved?' on':'')+'" data-guide-save="'+id+'" aria-pressed="'+saved+'">'+(saved?'★ Saved':'☆ Save for later')+'</button>'+(opts.compact?'<a class="g-btn" href="Guide Library.dc.html#g='+id+'" target="_blank" rel="noopener">Open in the guide library ↗</a>':'<button type="button" class="g-btn" data-guide-print="'+id+'">Print</button>')+'</div>';
 return '<article class="g-guide'+(opts.compact?' compact':'')+'" data-guide-id="'+id+'" id="guide-'+id+'">'
  +'<div class="g-meta"><span class="g-level l-'+g.level+'">'+lv.n+' · '+lv.label+'</span><span class="g-kind k-'+g.kind+'">'+KINDS[g.kind]+'</span><span class="g-topic">'+topicLabel(g.topic)+'</span><span class="g-mins">'+g.minutes+' min read</span></div>'
  +'<h3 class="g-title">'+esc(g.title)+'</h3><p class="g-summary">'+esc(g.summary)+'</p>'+tools
  +'<div class="g-body">'+body+'</div>'+course+foot+related+actions+'</article>';
}
function search(q){q=(q||'').trim().toLowerCase();if(!q)return GUIDES.map(g=>g.id);const words=q.split(/\s+/);return GUIDES.filter(g=>{const hay=(g.title+' '+g.summary+' '+g.kw+' '+g.body.replace(/<[^>]+>/g,' ')).toLowerCase();return words.every(w=>hay.includes(w));}).map(g=>g.id);}
function glossarySearch(q){q=(q||'').trim().toLowerCase();return Object.entries(GLOSSARY).filter(([k,v])=>!q||(v.t+' '+v.d).toLowerCase().includes(q)).sort((a,b)=>a[1].t.localeCompare(b[1].t));}

/* Behaviour inside rendered guides: calculators, glossary pop-overs, read and save buttons. Call once per container. */
function enhance(root,opts){
 opts=opts||{};if(!root||root.__guidesEnhanced)return;root.__guidesEnhanced=true;
 const runCalc=box=>{const c=CALCS[box.dataset.calc];if(!c)return;const v={};box.querySelectorAll('[data-k]').forEach(el=>{v[el.dataset.k]=parseFloat(el.value);});const out=box.querySelector('.g-calc-out');try{out.innerHTML=c.run(v);}catch(_){out.textContent='Check the values.';}};
 root.addEventListener('input',e=>{const box=e.target.closest&&e.target.closest('.g-calc');if(box)runCalc(box);});
 root.addEventListener('change',e=>{const box=e.target.closest&&e.target.closest('.g-calc');if(box)runCalc(box);});
 root.querySelectorAll('.g-calc').forEach(runCalc);
 const closePop=()=>{root.querySelectorAll('.g-pop').forEach(p=>p.remove());root.querySelectorAll('dfn[aria-expanded]').forEach(d=>d.removeAttribute('aria-expanded'));};
 root.addEventListener('click',e=>{
  const dfn=e.target.closest&&e.target.closest('dfn[data-term]');
  if(dfn){e.preventDefault();const open=dfn.getAttribute('aria-expanded')==='true';closePop();if(open)return;const t=GLOSSARY[dfn.dataset.term];if(!t)return;const pop=document.createElement('span');pop.className='g-pop';pop.setAttribute('role','note');pop.innerHTML='<b>'+esc(t.t)+'</b>'+esc(t.d)+(opts.glossaryHref?'<a href="'+opts.glossaryHref+'">Glossary</a>':'');dfn.setAttribute('aria-expanded','true');dfn.insertAdjacentElement('afterend',pop);return;}
  if(!e.target.closest('.g-pop'))closePop();
  const read=e.target.closest&&e.target.closest('[data-guide-read]');
  if(read){const on=progress.markRead(read.dataset.guideRead,read.getAttribute('aria-pressed')!=='true');read.classList.toggle('on',on);read.setAttribute('aria-pressed',String(on));read.textContent=on?'✓ Read':'Mark as read';if(opts.onProgress)opts.onProgress();return;}
  const save=e.target.closest&&e.target.closest('[data-guide-save]');
  if(save){const on=progress.toggleSaved(save.dataset.guideSave);save.classList.toggle('on',on);save.setAttribute('aria-pressed',String(on));save.textContent=on?'★ Saved':'☆ Save for later';if(opts.onProgress)opts.onProgress();return;}
  const print=e.target.closest&&e.target.closest('[data-guide-print]');
  if(print){if(opts.onPrint)opts.onPrint(print.dataset.guidePrint);else window.print();return;}
  const link=e.target.closest&&e.target.closest('[data-guide]');
  if(link&&opts.onOpen){e.preventDefault();opts.onOpen(link.dataset.guide);}
 });
 root.querySelectorAll('dfn[data-term]').forEach(d=>{d.tabIndex=0;d.setAttribute('role','button');d.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();d.click();}});});
}

window.EVGuides={LEVELS,TOPICS,KINDS,GUIDES,GLOSSARY,LINKS,QUIZ,CALCS,byId,levelOf,topicLabel,guideHTML,chip,search,glossarySearch,enhance,progress,DISCLAIMER,
 version:1,
 /* The guide a page or tool opens by default. Keys are used by the planner's Help buttons. */
 pageGuide:{home:'planner-first-project',projects:'planner-backups',overview:'planner-first-project',markup:'planner-markup-tools',planning:'planner-pages',programme:'planner-pages',snags:'planner-pages',audit:'pcpr',issue:'planner-pages',profile:'planner-first-project',guides:'planner-first-project'}
};
})();
