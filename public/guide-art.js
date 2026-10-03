/* Diagrams and animations for the guide library and the planner's help drawer: inline SVG strings in the planner's navy and lime palette. */
(function(){
'use strict';
const ART={};

ART.chain=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 230" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>The path of electricity from the network cut-out, through the meter and distribution board, to the charger and the car</title>
<style>
.gac-dot{animation:gac-flow 2.4s linear infinite}
@keyframes gac-flow{from{transform:translateX(0)}to{transform:translateX(96px)}}
@media (prefers-reduced-motion:reduce){.gac-dot{animation:none}}
</style>
<line x1="20" y1="97" x2="596" y2="97" stroke="#3b5a74" stroke-width="4" stroke-linecap="round"/>
<g fill="#d4e99b" stroke="#122b3e" stroke-width="1.5">
<circle class="ga-anim gac-dot" cx="20" cy="97" r="5"/>
<circle class="ga-anim gac-dot" cx="116" cy="97" r="5"/>
<circle class="ga-anim gac-dot" cx="212" cy="97" r="5"/>
<circle class="ga-anim gac-dot" cx="308" cy="97" r="5"/>
<circle class="ga-anim gac-dot" cx="404" cy="97" r="5"/>
<circle class="ga-anim gac-dot" cx="500" cy="97" r="5"/>
</g>
<g fill="#122b3e">
<rect x="12" y="52" width="100" height="90" rx="8"/>
<rect x="156" y="52" width="100" height="90" rx="8"/>
<rect x="300" y="52" width="100" height="90" rx="8"/>
<rect x="444" y="52" width="100" height="90" rx="8"/>
</g>
<g fill="#ffffff" font-size="13" text-anchor="middle">
<text x="62" y="93">DNO cut-out</text><text x="62" y="109">(main fuse)</text>
<text x="206" y="86">Meter</text>
<text x="350" y="75">Distribution</text><text x="350" y="91">board</text>
<text x="494" y="93">EV charger</text>
</g>
<rect x="176" y="100" width="60" height="26" rx="4" fill="#ffffff"/>
<text x="206" y="118" font-size="12" fill="#183043" text-anchor="middle">kWh</text>
<rect x="307" y="98" width="86" height="36" rx="4" fill="#ffffff"/>
<text x="350" y="113" font-size="12" fill="#183043" text-anchor="middle">RCBO Type A</text>
<text x="350" y="128" font-size="12" fill="#183043" text-anchor="middle">30 mA</text>
<rect x="478" y="104" width="32" height="14" rx="3" fill="#d4e99b"/>
<g fill="#284459">
<rect x="596" y="88" width="110" height="32" rx="8"/>
<path d="M616 88L628 68L676 68L694 88Z"/>
</g>
<path d="M622 86L631 72L672 72L686 86Z" fill="#f5f7fa"/>
<circle cx="620" cy="122" r="10" fill="#122b3e"/><circle cx="620" cy="122" r="4" fill="#f5f7fa"/>
<circle cx="684" cy="122" r="10" fill="#122b3e"/><circle cx="684" cy="122" r="4" fill="#f5f7fa"/>
<rect x="591" y="91" width="10" height="12" rx="2" fill="#d4e99b" stroke="#122b3e" stroke-width="1.5"/>
<g fill="#586e80" font-size="12" text-anchor="middle">
<text x="62" y="166">belongs to the</text><text x="62" y="181">network operator</text>
<text x="206" y="166">measures the</text><text x="206" y="181">energy used</text>
<text x="350" y="166">one dedicated</text><text x="350" y="181">circuit per charger</text>
<text x="494" y="166">7 kW, 11 kW</text><text x="494" y="181">or 22 kW</text>
<text x="651" y="166">charges at the</text><text x="651" y="181">car's own limit</text>
</g>
</svg>`;

ART.speeds=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 260" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>Bar chart: roughly how long it takes to add 200 miles of range, from about 26 hours on a 3-pin socket to about 25 minutes on an ultra-rapid charger</title>
<style>
.gas-bar{transform-box:fill-box;transform-origin:0 50%;animation:gas-grow 1.2s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes gas-grow{from{transform:scaleX(0)}}
.gas-lab{animation:gas-fade .6s .7s both}
@keyframes gas-fade{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.gas-bar,.gas-lab{animation:none}}
</style>
<text x="16" y="28" font-size="15" font-weight="700" fill="#183043">Roughly how long to add 200 miles of range</text>
<g font-size="13" fill="#183043" text-anchor="end">
<text x="250" y="67">3-pin socket · 2.3 kW</text>
<text x="250" y="105">Home or workplace charger · 7 kW</text>
<text x="250" y="137">Three-phase charger · 22 kW</text>
<text x="250" y="152" font-size="12" fill="#586e80">if the car accepts 22 kW</text>
<text x="250" y="181">Rapid · 50 kW</text>
<text x="250" y="219">Ultra-rapid · 150 kW</text>
</g>
<line x1="262" y1="44" x2="262" y2="232" stroke="#c8d4df" stroke-width="1.5"/>
<rect class="ga-anim gas-bar" x="262" y="53" width="370" height="18" rx="5" fill="#122b3e"/>
<rect class="ga-anim gas-bar" x="262" y="91" width="292" height="18" rx="5" fill="#122b3e"/>
<rect class="ga-anim gas-bar" x="262" y="129" width="212" height="18" rx="5" fill="#122b3e"/>
<rect class="ga-anim gas-bar" x="262" y="167" width="148" height="18" rx="5" fill="#2563eb"/>
<rect class="ga-anim gas-bar" x="262" y="205" width="66" height="18" rx="5" fill="#2563eb"/>
<g class="ga-anim gas-lab" font-size="13" font-weight="700" fill="#183043">
<text x="640" y="67">about 26 h</text>
<text x="562" y="105">about 9 h</text>
<text x="482" y="143">about 3 h</text>
<text x="418" y="181">about 1 h 15 min</text>
<text x="336" y="219">about 25 min</text>
</g>
<text x="16" y="250" font-size="12" fill="#586e80">Approximate, for a 60 kWh car; the car's own limit and the battery temperature change this.</text>
</svg>`;

ART.headroom=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 200" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>A 100 A supply shown as a bar: 55 A of existing demand, 45 A of room for chargers, and the supply limit marked at the right</title>
<style>
.gah-room{animation:gah-pulse 3.2s ease-in-out infinite}
@keyframes gah-pulse{0%,100%{opacity:1}50%{opacity:.72}}
@media (prefers-reduced-motion:reduce){.gah-room{animation:none}}
</style>
<text x="40" y="36" font-size="13" fill="#586e80">100 A single-phase supply</text>
<text x="680" y="36" font-size="13" font-weight="700" fill="#d42626" text-anchor="end">Supply limit (main fuse)</text>
<rect class="ga-anim gah-room" x="40" y="56" width="640" height="48" rx="8" fill="#d4e99b"/>
<rect x="40" y="56" width="352" height="48" rx="8" fill="#122b3e"/>
<rect x="372" y="56" width="20" height="48" fill="#122b3e"/>
<text x="216" y="85" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">Existing demand 55 A</text>
<text x="536" y="85" font-size="14" font-weight="700" fill="#163322" text-anchor="middle">Room for chargers 45 A</text>
<line x1="680" y1="46" x2="680" y2="118" stroke="#d42626" stroke-width="2" stroke-dasharray="6 4"/>
<path d="M392 112V120H597V112" fill="none" stroke="#586e80" stroke-width="1.5"/>
<text x="494" y="136" font-size="12" fill="#586e80" text-anchor="middle">32 A · one 7 kW charger</text>
<rect x="40" y="150" width="20" height="36" rx="4" fill="#122b3e"/>
<rect x="45" y="156" width="10" height="8" rx="1.5" fill="#d4e99b"/>
<text x="70" y="166" font-size="14" fill="#183043">One 7 kW charger uses 32 A</text>
<text x="70" y="183" font-size="12" fill="#586e80">so this supply has room for one, or for two sharing the 45 A under load management</text>
</svg>`;

ART.survey=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 360" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>Plan of a building and car park with six numbered points to record on a site survey, from the supply head to access and lighting</title>
<rect x="24" y="48" width="124" height="264" rx="8" fill="#f5f7fa" stroke="#122b3e" stroke-width="2"/>
<text x="86" y="74" font-size="14" font-weight="700" fill="#183043" text-anchor="middle">Building</text>
<rect x="40" y="100" width="22" height="28" rx="3" fill="#284459"/>
<rect x="46" y="108" width="10" height="12" rx="1.5" fill="#ffffff"/>
<rect x="86" y="170" width="44" height="44" rx="4" fill="#ffffff" stroke="#122b3e" stroke-width="2"/>
<g fill="#122b3e">
<rect x="93" y="186" width="6" height="12"/><rect x="103" y="186" width="6" height="12"/><rect x="113" y="186" width="6" height="12"/><rect x="123" y="186" width="6" height="12"/>
</g>
<rect x="170" y="48" width="278" height="264" rx="8" fill="#ffffff" stroke="#c8d4df" stroke-width="2"/>
<text x="309" y="250" font-size="13" fill="#586e80" text-anchor="middle">Car park</text>
<g fill="none" stroke="#3b5a74" stroke-width="2">
<rect x="200" y="72" width="56" height="100"/><rect x="262" y="72" width="56" height="100"/><rect x="324" y="72" width="56" height="100"/><rect x="386" y="72" width="56" height="100"/>
</g>
<path d="M130 192H187V61H414" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>
<g fill="#122b3e">
<rect x="220" y="54" width="16" height="14" rx="2"/><rect x="282" y="54" width="16" height="14" rx="2"/><rect x="344" y="54" width="16" height="14" rx="2"/><rect x="406" y="54" width="16" height="14" rx="2"/>
</g>
<g fill="#3b5a74">
<rect x="400" y="186" width="4" height="6"/><rect x="407" y="182" width="4" height="10"/><rect x="414" y="178" width="4" height="14"/><rect x="421" y="174" width="4" height="18"/>
</g>
<rect x="364" y="306" width="64" height="12" fill="#ffffff"/>
<text x="396" y="334" font-size="12" fill="#586e80" text-anchor="middle">Entrance</text>
<line x1="438" y1="292" x2="438" y2="304" stroke="#3b5a74" stroke-width="2"/>
<circle cx="438" cy="288" r="5" fill="#ffcf73" stroke="#122b3e" stroke-width="1"/>
<g fill="#d4e99b" stroke="#122b3e" stroke-width="1.5">
<circle cx="82" cy="114" r="12"/><circle cx="108" cy="240" r="12"/><circle cx="187" cy="130" r="12"/><circle cx="321" cy="61" r="12"/><circle cx="412" cy="216" r="12"/><circle cx="396" cy="282" r="12"/>
</g>
<g fill="#122b3e" font-size="13" font-weight="700" text-anchor="middle">
<text x="82" y="119">1</text><text x="108" y="245">2</text><text x="187" y="135">3</text><text x="321" y="66">4</text><text x="412" y="221">5</text><text x="396" y="287">6</text>
</g>
<text x="466" y="54" font-size="14" font-weight="700" fill="#183043">Six things to record</text>
<g fill="#d4e99b" stroke="#122b3e" stroke-width="1.5">
<circle cx="478" cy="84" r="12"/><circle cx="478" cy="124" r="12"/><circle cx="478" cy="164" r="12"/><circle cx="478" cy="204" r="12"/><circle cx="478" cy="244" r="12"/><circle cx="478" cy="284" r="12"/>
</g>
<g fill="#122b3e" font-size="13" font-weight="700" text-anchor="middle">
<text x="478" y="89">1</text><text x="478" y="129">2</text><text x="478" y="169">3</text><text x="478" y="209">4</text><text x="478" y="249">5</text><text x="478" y="289">6</text>
</g>
<g fill="#183043" font-size="13">
<text x="498" y="89">Supply head and main fuse</text>
<text x="498" y="129">Meter and distribution board</text>
<text x="498" y="169">Cable route and where it crosses</text>
<text x="498" y="209">Charger positions and bays</text>
<text x="498" y="249">Mobile or Wi-Fi signal check</text>
<text x="498" y="289">Access, lighting and signs</text>
</g>
</svg>`;

ART.bays=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 330" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>Plan view of a standard 2.4 by 4.8 metre EV bay and an accessible bay to PAS 1899 with a 1.2 metre hatched transfer zone, a charger at the head and a wheel stop</title>
<text x="125" y="26" font-size="14" font-weight="700" fill="#183043" text-anchor="middle">Standard bay</text>
<line x1="70" y1="58" x2="180" y2="58" stroke="#586e80" stroke-width="1.5"/>
<polygon points="70,58 78,54 78,62" fill="#586e80"/><polygon points="180,58 172,54 172,62" fill="#586e80"/>
<text x="125" y="50" font-size="13" fill="#183043" text-anchor="middle">2.4 m</text>
<line x1="48" y1="74" x2="48" y2="295" stroke="#586e80" stroke-width="1.5"/>
<polygon points="48,74 44,82 52,82" fill="#586e80"/><polygon points="48,295 44,287 52,287" fill="#586e80"/>
<text x="36" y="185" font-size="13" fill="#183043" text-anchor="middle" transform="rotate(-90 36 185)">4.8 m</text>
<rect x="70" y="74" width="110" height="221" rx="2" fill="#ffffff" stroke="#122b3e" stroke-width="2"/>
<rect x="71" y="281" width="108" height="13" fill="#d4e99b"/>
<text x="125" y="170" font-size="16" font-weight="700" fill="#3b5a74" text-anchor="middle">EV</text>
<text x="125" y="192" font-size="16" font-weight="700" fill="#3b5a74" text-anchor="middle">ONLY</text>
<text x="125" y="324" font-size="12" fill="#586e80" text-anchor="middle">open end</text>
<text x="412" y="26" font-size="14" font-weight="700" fill="#183043" text-anchor="middle">Accessible bay (PAS 1899)</text>
<rect x="330" y="74" width="110" height="221" rx="2" fill="#ffffff" stroke="#122b3e" stroke-width="2"/>
<rect x="440" y="74" width="55" height="221" fill="#f5f7fa" stroke="#122b3e" stroke-width="2"/>
<path d="M440 88L454 74M440 102L468 74M440 116L482 74M440 130L495 75M440 144L495 89M440 158L495 103M440 172L495 117M440 186L495 131M440 200L495 145M440 214L495 159M440 228L495 173M440 242L495 187M440 256L495 201M440 270L495 215M440 284L495 229M443 295L495 243M457 295L495 257M471 295L495 271M485 295L495 285" stroke="#3b5a74" stroke-width="2" fill="none"/>
<text x="385" y="170" font-size="16" font-weight="700" fill="#3b5a74" text-anchor="middle">EV</text>
<text x="385" y="192" font-size="16" font-weight="700" fill="#3b5a74" text-anchor="middle">ONLY</text>
<rect x="348" y="96" width="74" height="10" rx="3" fill="#284459"/>
<text x="385" y="124" font-size="12" fill="#586e80" text-anchor="middle">wheel stop</text>
<rect x="426" y="36" width="32" height="34" rx="6" fill="#122b3e"/>
<rect x="434" y="44" width="16" height="10" rx="2" fill="#d4e99b"/>
<text x="512" y="50" font-size="13" fill="#183043">charger reachable</text>
<text x="512" y="66" font-size="13" fill="#183043">from the hatched side</text>
<text x="512" y="100" font-size="12" fill="#586e80">controls 0.75 to 1.2 m</text>
<text x="512" y="115" font-size="12" fill="#586e80">above the ground</text>
<line x1="440" y1="308" x2="495" y2="308" stroke="#586e80" stroke-width="1.5"/>
<polygon points="440,308 448,304 448,312" fill="#586e80"/><polygon points="495,308 487,304 487,312" fill="#586e80"/>
<text x="467" y="324" font-size="12" fill="#183043" text-anchor="middle">1.2 m hatched zone</text>
</svg>`;

ART.base=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 300" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>Cross-section of a charger post on a concrete base with a swept duct rising through it, the duct buried at 450 millimetres with warning tape above</title>
<rect x="0" y="128" width="720" height="172" fill="#f5f7fa"/>
<rect x="0" y="120" width="720" height="8" fill="#3b5a74"/>
<line x1="0" y1="120" x2="720" y2="120" stroke="#122b3e" stroke-width="2"/>
<text x="16" y="112" font-size="12" fill="#586e80">Ground level</text>
<rect x="430" y="120" width="168" height="112" fill="#c8d4df" stroke="#122b3e" stroke-width="2"/>
<path d="M40 255H454Q514 255 514 195V120" fill="none" stroke="#3b5a74" stroke-width="18"/>
<path d="M40 255H454Q514 255 514 195V120" fill="none" stroke="#ffffff" stroke-width="11"/>
<path d="M40 255H454Q514 255 514 195V120" fill="none" stroke="#586e80" stroke-width="2" stroke-dasharray="7 6"/>
<line x1="40" y1="204" x2="416" y2="204" stroke="#ffcf73" stroke-width="4"/>
<text x="212" y="196" font-size="12" fill="#183043">Warning tape 150 mm above the duct</text>
<rect x="494" y="30" width="40" height="90" rx="6" fill="#122b3e"/>
<rect x="502" y="44" width="24" height="16" rx="2" fill="#d4e99b"/>
<text x="514" y="22" font-size="12" fill="#586e80" text-anchor="middle">Charger</text>
<text x="552" y="60" font-size="13" font-weight="700" fill="#183043">Concrete base</text>
<text x="552" y="78" font-size="13" fill="#183043">600 × 600 × 400 mm,</text>
<text x="552" y="96" font-size="13" fill="#183043">flush with the surface</text>
<line x1="430" y1="106" x2="598" y2="106" stroke="#586e80" stroke-width="1.5"/>
<polygon points="430,106 438,102 438,110" fill="#586e80"/><polygon points="598,106 590,102 590,110" fill="#586e80"/>
<text x="486" y="100" font-size="13" fill="#183043" text-anchor="end">600 mm</text>
<line x1="612" y1="120" x2="612" y2="232" stroke="#586e80" stroke-width="1.5"/>
<polygon points="612,120 608,128 616,128" fill="#586e80"/><polygon points="612,232 608,224 616,224" fill="#586e80"/>
<text x="620" y="180" font-size="13" fill="#183043">400 mm</text>
<line x1="200" y1="120" x2="200" y2="246" stroke="#586e80" stroke-width="1.5"/>
<polygon points="200,120 196,128 204,128" fill="#586e80"/><polygon points="200,246 196,238 204,238" fill="#586e80"/>
<text x="192" y="168" font-size="13" fill="#183043" text-anchor="end">450 mm cover,</text>
<text x="192" y="184" font-size="12" fill="#586e80" text-anchor="end">600 mm under roads</text>
<text x="44" y="240" font-size="12" fill="#586e80">from the board</text>
<text x="300" y="240" font-size="12" fill="#586e80">draw cord inside</text>
<text x="44" y="286" font-size="13" fill="#183043">63 mm twin-wall duct, swept bend, cut flush</text>
</svg>`;

ART.earthing=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 300" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>Three earthing arrangements side by side: TN-C-S with a combined PEN conductor, TN-S with a separate network earth, and TT with a local earth rod</title>
<g fill="#f5f7fa" stroke="#c8d4df" stroke-width="1.5">
<rect x="8" y="8" width="226" height="284" rx="10"/><rect x="247" y="8" width="226" height="284" rx="10"/><rect x="486" y="8" width="226" height="284" rx="10"/>
</g>
<g font-size="14" font-weight="700" fill="#183043" text-anchor="middle">
<text x="121" y="34">TN-C-S (PME)</text><text x="360" y="34">TN-S</text><text x="599" y="34">TT</text>
</g>
<g fill="#ffffff" stroke="#122b3e" stroke-width="2">
<circle cx="48" cy="100" r="14"/><circle cx="66" cy="100" r="14"/>
<circle cx="287" cy="100" r="14"/><circle cx="305" cy="100" r="14"/>
<circle cx="526" cy="100" r="14"/><circle cx="544" cy="100" r="14"/>
<rect x="168" y="80" width="52" height="44" rx="6"/><rect x="407" y="80" width="52" height="44" rx="6"/><rect x="646" y="80" width="52" height="44" rx="6"/>
</g>
<g font-size="12" fill="#586e80" text-anchor="middle">
<text x="57" y="76">transformer</text><text x="296" y="76">transformer</text><text x="535" y="76">transformer</text>
<text x="194" y="70">premises</text><text x="433" y="70">premises</text><text x="672" y="70">premises</text>
</g>
<g font-size="12" fill="#183043" text-anchor="middle">
<text x="194" y="106">Board</text><text x="433" y="106">Board</text><text x="672" y="106">Board</text>
</g>
<g stroke="#122b3e" stroke-width="2" fill="none">
<path d="M57 114V136M47 136H67M51 141H63M54 146H60"/>
<path d="M296 114V136M286 136H306M290 141H302M293 146H299"/>
<path d="M535 114V136M525 136H545M529 141H541M532 146H538"/>
<path d="M80 92H168M319 92H407M558 92H646"/>
<path d="M138 106H168M319 106H407M558 106H646"/>
</g>
<line x1="80" y1="106" x2="126" y2="106" stroke="#284459" stroke-width="4"/>
<rect x="126" y="98" width="12" height="16" fill="#122b3e"/>
<path d="M132 114V120H168" fill="none" stroke="#4ba069" stroke-width="2"/>
<text x="153" y="101" font-size="12" fill="#586e80" text-anchor="middle">N</text>
<text x="153" y="133" font-size="12" fill="#4ba069" text-anchor="middle">E</text>
<line x1="319" y1="120" x2="407" y2="120" stroke="#4ba069" stroke-width="2"/>
<line x1="672" y1="124" x2="672" y2="160" stroke="#4ba069" stroke-width="2"/>
<rect x="668" y="160" width="8" height="40" rx="2" fill="#284459"/>
<g font-size="13" fill="#183043" text-anchor="middle">
<text x="108" y="174">PEN (neutral and</text><text x="108" y="192">earth combined)</text>
<text x="360" y="174">Separate earth</text><text x="360" y="192">from the network</text>
</g>
<text x="658" y="178" font-size="13" fill="#183043" text-anchor="end">Local earth</text>
<text x="658" y="196" font-size="13" fill="#183043" text-anchor="end">electrode (rod)</text>
<g font-size="12" fill="#586e80" text-anchor="middle">
<text x="121" y="254">Most common. Needs open-PEN</text><text x="121" y="272">protection for outdoor charging</text>
<text x="360" y="254">Confirm it really is TN-S</text>
<text x="599" y="254">Only where no TN earth</text><text x="599" y="272">is available</text>
</g>
</svg>`;

ART.penFault=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 280" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>Animated sequence: a PME supply loses its PEN conductor, the car body and charger case rise to mains voltage, then an open-PEN device disconnects the charger</title>
<style>
.gap-s1{animation:gap-k-s1 8s linear infinite}
.gap-s2{animation:gap-k-s2 8s linear infinite}
.gap-s3{animation:gap-k-s3 8s linear infinite}
.gap-break{animation:gap-k-break 8s linear infinite}
.gap-hot{animation:gap-k-hot 8s linear infinite}
.gap-dev{animation:gap-k-on 8s linear infinite}
.gap-sw{animation:gap-k-off 8s linear infinite}
.gap-blade{animation:gap-k-on 8s linear infinite}
.gap-safe{animation:gap-k-on 8s linear infinite}
@keyframes gap-k-s1{0%,24%{opacity:1}26%,100%{opacity:0}}
@keyframes gap-k-s2{0%,24%{opacity:0}26%,55%{opacity:1}58%,100%{opacity:0}}
@keyframes gap-k-s3{0%,55%{opacity:0}58%,100%{opacity:1}}
@keyframes gap-k-break{0%,24%{opacity:0}26%,100%{opacity:1}}
@keyframes gap-k-hot{0%,30%{opacity:0}33%,56%{opacity:1}62%,100%{opacity:0}}
@keyframes gap-k-on{0%,55%{opacity:0}58%,100%{opacity:1}}
@keyframes gap-k-off{0%,55%{opacity:1}58%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.gap-s1,.gap-s2,.gap-s3,.gap-break,.gap-hot,.gap-dev,.gap-sw,.gap-blade,.gap-safe{animation:none}}
</style>
<text class="ga-anim gap-s1" opacity="0" x="24" y="32" font-size="14" font-weight="700" fill="#586e80">Normal: the PEN carries the return current</text>
<text class="ga-anim gap-s2" opacity="0" x="24" y="32" font-size="14" font-weight="700" fill="#d42626">Fault: the PEN conductor has broken</text>
<text class="ga-anim gap-s3" opacity="1" x="24" y="32" font-size="14" font-weight="700" fill="#4ba069">Protected: the open-PEN device has disconnected the charger</text>
<line x1="20" y1="164" x2="700" y2="164" stroke="#586e80" stroke-width="2"/>
<text x="24" y="180" font-size="12" fill="#586e80">Ground</text>
<g fill="#ffffff" stroke="#122b3e" stroke-width="2">
<circle cx="44" cy="112" r="14"/><circle cx="62" cy="112" r="14"/>
</g>
<line x1="53" y1="126" x2="53" y2="164" stroke="#122b3e" stroke-width="2"/>
<text x="53" y="82" font-size="12" fill="#586e80" text-anchor="middle">Transformer</text>
<line x1="76" y1="100" x2="250" y2="100" stroke="#122b3e" stroke-width="2"/>
<line x1="76" y1="118" x2="250" y2="118" stroke="#284459" stroke-width="4"/>
<text x="163" y="88" font-size="13" fill="#586e80" text-anchor="middle">PEN conductor</text>
<g class="ga-anim gap-break" opacity="1">
<rect x="150" y="113" width="22" height="10" fill="#ffffff"/>
<line x1="140" y1="118" x2="150" y2="118" stroke="#d42626" stroke-width="4"/>
<line x1="172" y1="118" x2="182" y2="118" stroke="#d42626" stroke-width="4"/>
<polyline points="165,100 157,118 165,118 157,136" fill="none" stroke="#d42626" stroke-width="2"/>
<text x="161" y="153" font-size="13" font-weight="700" fill="#d42626" text-anchor="middle">Broken PEN</text>
</g>
<rect x="250" y="72" width="60" height="78" rx="8" fill="#ffffff" stroke="#122b3e" stroke-width="2"/>
<text x="280" y="106" font-size="12" fill="#183043" text-anchor="middle">House</text>
<text x="280" y="122" font-size="12" fill="#183043" text-anchor="middle">board</text>
<line x1="310" y1="100" x2="346" y2="100" stroke="#122b3e" stroke-width="2"/>
<line x1="310" y1="118" x2="346" y2="118" stroke="#122b3e" stroke-width="2"/>
<line x1="310" y1="136" x2="346" y2="136" stroke="#4ba069" stroke-width="2"/>
<rect x="346" y="84" width="64" height="68" rx="6" fill="#ffffff" stroke="#122b3e" stroke-width="2"/>
<rect class="ga-anim gap-dev" opacity="1" x="346" y="84" width="64" height="68" rx="6" fill="#d4e99b" stroke="#122b3e" stroke-width="2"/>
<text x="378" y="112" font-size="12" fill="#183043" text-anchor="middle">Open-PEN</text>
<text x="378" y="128" font-size="12" fill="#183043" text-anchor="middle">device</text>
<g class="ga-anim gap-sw" opacity="0">
<line x1="410" y1="100" x2="436" y2="100" stroke="#122b3e" stroke-width="2"/>
<line x1="410" y1="118" x2="436" y2="118" stroke="#122b3e" stroke-width="2"/>
<line x1="410" y1="136" x2="436" y2="136" stroke="#4ba069" stroke-width="2"/>
</g>
<g class="ga-anim gap-blade" opacity="1" stroke="#122b3e" stroke-width="2">
<line x1="412" y1="100" x2="430" y2="86"/><line x1="412" y1="118" x2="430" y2="104"/><line x1="412" y1="136" x2="430" y2="122"/>
</g>
<rect x="436" y="66" width="44" height="88" rx="8" fill="#ffffff" stroke="#122b3e" stroke-width="2"/>
<rect x="447" y="78" width="22" height="14" rx="2" fill="#d4e99b"/>
<text x="458" y="56" font-size="12" fill="#586e80" text-anchor="middle">Charger</text>
<line x1="480" y1="128" x2="512" y2="128" stroke="#122b3e" stroke-width="2"/>
<g fill="#f5f7fa" stroke="#122b3e" stroke-width="2">
<rect x="512" y="112" width="128" height="34" rx="10"/>
<path d="M536 112L548 92L604 92L620 112"/>
</g>
<g fill="#ffffff" stroke="#122b3e" stroke-width="2">
<circle cx="540" cy="155" r="9"/><circle cx="614" cy="155" r="9"/><circle cx="666" cy="96" r="8"/>
</g>
<path d="M666 104V134M666 134L658 164M666 134L674 164M666 112L644 122M666 112L684 130" fill="none" stroke="#122b3e" stroke-width="2"/>
<g class="ga-anim gap-hot" opacity="0" fill="none" stroke="#d42626" stroke-width="3">
<rect x="512" y="112" width="128" height="34" rx="10"/>
<path d="M536 112L548 92L604 92L620 112"/>
<rect x="436" y="66" width="44" height="88" rx="8"/>
<path d="M666 104V134M666 134L658 164M666 134L674 164M666 112L644 122"/>
<text x="580" y="76" font-size="13" font-weight="700" fill="#d42626" stroke="none" text-anchor="middle">Car body at mains voltage</text>
</g>
<g class="ga-anim gap-safe" opacity="1">
<rect x="24" y="212" width="328" height="34" rx="8" fill="#d4e99b"/>
<text x="188" y="234" font-size="14" font-weight="700" fill="#163322" text-anchor="middle">Open-PEN device disconnects every conductor</text>
</g>
<text x="380" y="228" font-size="12" fill="#586e80">The device opens live, neutral and earth,</text>
<text x="380" y="244" font-size="12" fill="#586e80">so the car is no longer tied to the fault.</text>
</svg>`;

ART.dlm=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 300" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>Animated load management: four chargers share a 64 A group limit, each bar falling as more cars plug in so the total never exceeds the limit</title>
<style>
.gad-bar{transform-box:fill-box;transform-origin:50% 100%}
.gad-b1{animation:gad-k-b1 10s linear infinite}
.gad-b2{animation:gad-k-b2 10s linear infinite}
.gad-b3{animation:gad-k-b3 10s linear infinite}
.gad-b4{animation:gad-k-b4 10s linear infinite}
.gad-c1{animation:gad-k-c1 10s linear infinite}
.gad-c2{animation:gad-k-c2 10s linear infinite}
.gad-c3{animation:gad-k-c3 10s linear infinite}
.gad-c4{animation:gad-k-c4 10s linear infinite}
.gad-t1{animation:gad-k-t1 10s linear infinite}
.gad-t2{animation:gad-k-t2 10s linear infinite}
.gad-t3{animation:gad-k-t3 10s linear infinite}
.gad-t4{animation:gad-k-t4 10s linear infinite}
@keyframes gad-k-b1{0%,10%{transform:scaleY(0)}13%,50%{transform:scaleY(1)}53%,70%{transform:scaleY(.66)}73%,97%{transform:scaleY(.5)}100%{transform:scaleY(0)}}
@keyframes gad-k-b2{0%,30%{transform:scaleY(0)}33%,50%{transform:scaleY(1)}53%,70%{transform:scaleY(.66)}73%,97%{transform:scaleY(.5)}100%{transform:scaleY(0)}}
@keyframes gad-k-b3{0%,50%{transform:scaleY(0)}53%,70%{transform:scaleY(.66)}73%,97%{transform:scaleY(.5)}100%{transform:scaleY(0)}}
@keyframes gad-k-b4{0%,70%{transform:scaleY(0)}73%,97%{transform:scaleY(.5)}100%{transform:scaleY(0)}}
@keyframes gad-k-c1{0%,10%{opacity:0}12%,97%{opacity:1}100%{opacity:0}}
@keyframes gad-k-c2{0%,30%{opacity:0}32%,97%{opacity:1}100%{opacity:0}}
@keyframes gad-k-c3{0%,50%{opacity:0}52%,97%{opacity:1}100%{opacity:0}}
@keyframes gad-k-c4{0%,70%{opacity:0}72%,97%{opacity:1}100%{opacity:0}}
@keyframes gad-k-t1{0%,11%{opacity:0}13%,30%{opacity:1}32%,100%{opacity:0}}
@keyframes gad-k-t2{0%,31%{opacity:0}33%,50%{opacity:1}52%,100%{opacity:0}}
@keyframes gad-k-t3{0%,51%{opacity:0}53%,70%{opacity:1}72%,100%{opacity:0}}
@keyframes gad-k-t4{0%,71%{opacity:0}73%,97%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.gad-b1,.gad-b2,.gad-b3,.gad-b4,.gad-c1,.gad-c2,.gad-c3,.gad-c4,.gad-t1,.gad-t2,.gad-t3,.gad-t4{animation:none}}
</style>
<line x1="60" y1="44" x2="660" y2="44" stroke="#122b3e" stroke-width="2" stroke-dasharray="8 5"/>
<text x="60" y="34" font-size="13" font-weight="700" fill="#183043">Group limit 64 A</text>
<g font-size="14" font-weight="700" fill="#183043" text-anchor="end">
<text class="ga-anim gad-t1" opacity="0" x="660" y="34">Total 32 A · one car</text>
<text class="ga-anim gad-t2" opacity="0" x="660" y="34">Total 64 A · two cars</text>
<text class="ga-anim gad-t3" opacity="0" x="660" y="34">Total 64 A · three cars</text>
<text class="ga-anim gad-t4" opacity="1" x="660" y="34">Total 64 A · four cars</text>
</g>
<g font-size="12" fill="#586e80" text-anchor="end">
<text x="108" y="66">32 A</text><text x="108" y="164">0</text>
</g>
<path d="M112 62H118M112 160H118" stroke="#586e80" stroke-width="1.5"/>
<g fill="#ffffff" stroke="#c8d4df" stroke-width="1.5">
<rect x="124" y="60" width="32" height="100" rx="4"/><rect x="264" y="60" width="32" height="100" rx="4"/><rect x="404" y="60" width="32" height="100" rx="4"/><rect x="544" y="60" width="32" height="100" rx="4"/>
</g>
<g fill="#284459">
<rect class="ga-anim gad-bar gad-b1" style="transform:scaleY(.5)" x="127" y="62" width="26" height="98" rx="3"/>
<rect class="ga-anim gad-bar gad-b2" style="transform:scaleY(.5)" x="267" y="62" width="26" height="98" rx="3"/>
<rect class="ga-anim gad-bar gad-b3" style="transform:scaleY(.5)" x="407" y="62" width="26" height="98" rx="3"/>
<rect class="ga-anim gad-bar gad-b4" style="transform:scaleY(.5)" x="547" y="62" width="26" height="98" rx="3"/>
</g>
<g fill="#122b3e">
<rect x="118" y="172" width="44" height="50" rx="6"/><rect x="258" y="172" width="44" height="50" rx="6"/><rect x="398" y="172" width="44" height="50" rx="6"/><rect x="538" y="172" width="44" height="50" rx="6"/>
</g>
<g fill="#d4e99b">
<rect x="128" y="180" width="24" height="12" rx="2"/><rect x="268" y="180" width="24" height="12" rx="2"/><rect x="408" y="180" width="24" height="12" rx="2"/><rect x="548" y="180" width="24" height="12" rx="2"/>
</g>
<g class="ga-anim gad-c1" opacity="1"><g fill="#3b5a74"><rect x="104" y="236" width="72" height="22" rx="8"/><path d="M116 236L124 226L154 226L162 236Z"/></g><circle cx="118" cy="259" r="6" fill="#122b3e"/><circle cx="162" cy="259" r="6" fill="#122b3e"/></g>
<g class="ga-anim gad-c2" opacity="1"><g fill="#3b5a74"><rect x="244" y="236" width="72" height="22" rx="8"/><path d="M256 236L264 226L294 226L302 236Z"/></g><circle cx="258" cy="259" r="6" fill="#122b3e"/><circle cx="302" cy="259" r="6" fill="#122b3e"/></g>
<g class="ga-anim gad-c3" opacity="1"><g fill="#3b5a74"><rect x="384" y="236" width="72" height="22" rx="8"/><path d="M396 236L404 226L434 226L442 236Z"/></g><circle cx="398" cy="259" r="6" fill="#122b3e"/><circle cx="442" cy="259" r="6" fill="#122b3e"/></g>
<g class="ga-anim gad-c4" opacity="1"><g fill="#3b5a74"><rect x="524" y="236" width="72" height="22" rx="8"/><path d="M536 236L544 226L574 226L582 236Z"/></g><circle cx="538" cy="259" r="6" fill="#122b3e"/><circle cx="582" cy="259" r="6" fill="#122b3e"/></g>
<text x="360" y="290" font-size="13" fill="#586e80" text-anchor="middle">Load management shares the group limit so the total never exceeds it.</text>
</svg>`;

ART.threePhase=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 260" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>Two panels: four single-phase chargers all on phase L1 overload it, while spreading them two, one and one across L1, L2 and L3 keeps every phase under its limit</title>
<g fill="#f5f7fa" stroke="#c8d4df" stroke-width="1.5">
<rect x="16" y="12" width="336" height="216" rx="10"/><rect x="368" y="12" width="336" height="216" rx="10"/>
</g>
<g font-size="14" font-weight="700" fill="#183043" text-anchor="middle">
<text x="184" y="38">Unbalanced</text><text x="536" y="38">Balanced</text>
</g>
<g stroke="#122b3e" stroke-width="2">
<line x1="40" y1="200" x2="328" y2="200"/><line x1="392" y1="200" x2="680" y2="200"/>
</g>
<g stroke="#586e80" stroke-width="1.5" stroke-dasharray="6 4">
<line x1="40" y1="102" x2="328" y2="102"/><line x1="392" y1="102" x2="680" y2="102"/>
</g>
<g font-size="12" fill="#586e80" text-anchor="end">
<text x="328" y="96">per-phase limit</text><text x="680" y="96">per-phase limit</text>
</g>
<g fill="#3b5a74">
<rect x="62" y="190" width="56" height="10"/><rect x="156" y="190" width="56" height="10"/><rect x="250" y="190" width="56" height="10"/>
<rect x="414" y="190" width="56" height="10"/><rect x="508" y="190" width="56" height="10"/><rect x="602" y="190" width="56" height="10"/>
</g>
<g fill="#122b3e">
<rect x="62" y="162" width="56" height="26" rx="4"/><rect x="62" y="134" width="56" height="26" rx="4"/><rect x="62" y="106" width="56" height="26" rx="4"/>
</g>
<rect x="62" y="78" width="56" height="26" rx="4" fill="#d42626"/>
<g font-size="12" fill="#ffffff" text-anchor="middle">
<text x="90" y="179">7 kW</text><text x="90" y="151">7 kW</text><text x="90" y="123">7 kW</text><text x="90" y="95">7 kW</text>
</g>
<g fill="#d4e99b">
<rect x="414" y="162" width="56" height="26" rx="4"/><rect x="414" y="134" width="56" height="26" rx="4"/><rect x="508" y="162" width="56" height="26" rx="4"/><rect x="602" y="162" width="56" height="26" rx="4"/>
</g>
<g font-size="12" fill="#163322" text-anchor="middle">
<text x="442" y="179">7 kW</text><text x="442" y="151">7 kW</text><text x="536" y="179">7 kW</text><text x="630" y="179">7 kW</text>
</g>
<g font-size="13" fill="#183043" text-anchor="middle">
<text x="90" y="220">L1</text><text x="184" y="220">L2</text><text x="278" y="220">L3</text>
<text x="442" y="220">L1</text><text x="536" y="220">L2</text><text x="630" y="220">L3</text>
</g>
<text x="360" y="250" font-size="13" fill="#586e80" text-anchor="middle">Single-phase chargers must be spread across the phases; three-phase chargers draw from all three.</text>
</svg>`;

ART.voltdrop=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 220" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>A long cable from a distribution board at 230 volts to a charger, the voltage falling to 221 volts along its length, with the 5 percent limit of 218.5 volts marked</title>
<style>
.gav-dot{animation:gav-flow 2.2s linear infinite}
@keyframes gav-flow{from{transform:translateX(0)}to{transform:translateX(62px)}}
@media (prefers-reduced-motion:reduce){.gav-dot{animation:none}}
</style>
<rect x="24" y="62" width="80" height="86" rx="8" fill="#122b3e"/>
<text x="64" y="100" font-size="13" fill="#ffffff" text-anchor="middle">Board</text>
<text x="64" y="122" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">230 V</text>
<text x="64" y="168" font-size="12" fill="#586e80" text-anchor="middle">230 V at the board</text>
<line x1="104" y1="105" x2="600" y2="105" stroke="#122b3e" stroke-width="8" stroke-linecap="round"/>
<line x1="104" y1="105" x2="600" y2="105" stroke="#ffcf73" stroke-width="4"/>
<line x1="104" y1="105" x2="228" y2="105" stroke="#d4e99b" stroke-width="4"/>
<line x1="228" y1="105" x2="352" y2="105" stroke="#d4e99b" stroke-width="4" opacity=".66"/>
<line x1="352" y1="105" x2="476" y2="105" stroke="#d4e99b" stroke-width="4" opacity=".33"/>
<g fill="#122b3e">
<circle class="ga-anim gav-dot" cx="104" cy="105" r="4"/><circle class="ga-anim gav-dot" cx="166" cy="105" r="4"/><circle class="ga-anim gav-dot" cx="228" cy="105" r="4"/><circle class="ga-anim gav-dot" cx="290" cy="105" r="4"/><circle class="ga-anim gav-dot" cx="352" cy="105" r="4"/><circle class="ga-anim gav-dot" cx="414" cy="105" r="4"/><circle class="ga-anim gav-dot" cx="476" cy="105" r="4"/><circle class="ga-anim gav-dot" cx="538" cy="105" r="4"/>
</g>
<g stroke="#c8d4df" stroke-width="1.5">
<line x1="269" y1="78" x2="269" y2="99"/><line x1="434" y1="78" x2="434" y2="99"/><line x1="622" y1="78" x2="622" y2="80"/>
</g>
<g font-size="13" font-weight="700" fill="#183043" text-anchor="middle">
<text x="269" y="72">227 V</text><text x="434" y="72">224 V</text><text x="622" y="72">221 V</text>
</g>
<text x="352" y="132" font-size="12" fill="#586e80" text-anchor="middle">long cable run</text>
<rect x="600" y="80" width="44" height="70" rx="8" fill="#122b3e"/>
<rect x="611" y="90" width="22" height="14" rx="2" fill="#d4e99b"/>
<text x="622" y="168" font-size="12" fill="#586e80" text-anchor="middle">221 V at the charger</text>
<line x1="672" y1="56" x2="672" y2="156" stroke="#d42626" stroke-width="2" stroke-dasharray="6 4"/>
<text x="712" y="46" font-size="12" font-weight="700" fill="#d42626" text-anchor="end">5 % limit = 218.5 V</text>
<text x="360" y="204" font-size="13" fill="#586e80" text-anchor="middle">The longer and thinner the cable, the more voltage is lost before the charger.</text>
</svg>`;

ART.rcd=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 280" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>How a residual current device trips when current leaks to earth, and which device types detect AC, pulsed DC and smooth DC fault currents</title>
<text x="24" y="32" font-size="14" font-weight="700" fill="#183043">How an RCD trips</text>
<text x="150" y="64" font-size="12" fill="#586e80" text-anchor="middle">sensing ring</text>
<circle cx="150" cy="130" r="48" fill="none" stroke="#284459" stroke-width="14"/>
<line x1="30" y1="122" x2="276" y2="122" stroke="#122b3e" stroke-width="2.5"/>
<line x1="30" y1="138" x2="276" y2="138" stroke="#3b5a74" stroke-width="2.5"/>
<text x="30" y="106" font-size="12" fill="#586e80">supply</text>
<text x="38" y="117" font-size="12" fill="#183043">L</text>
<text x="38" y="154" font-size="12" fill="#183043">N</text>
<rect x="276" y="100" width="48" height="60" rx="6" fill="#122b3e"/>
<text x="300" y="134" font-size="12" fill="#ffffff" text-anchor="middle">Load</text>
<text x="150" y="200" font-size="12" fill="#586e80" text-anchor="middle">normally the two currents cancel</text>
<line x1="300" y1="160" x2="300" y2="200" stroke="#d42626" stroke-width="2" stroke-dasharray="5 4"/>
<path d="M286 204H314M291 210H309M295 216H305" stroke="#d42626" stroke-width="2"/>
<text x="24" y="240" font-size="12" fill="#d42626">Leak to earth: the currents no longer</text>
<text x="24" y="256" font-size="12" fill="#d42626">balance, the device trips</text>
<line x1="348" y1="48" x2="348" y2="268" stroke="#c8d4df" stroke-width="1.5"/>
<text x="372" y="32" font-size="14" font-weight="700" fill="#183043">Which type detects which fault</text>
<g stroke="#c8d4df" stroke-width="1">
<line x1="372" y1="80" x2="480" y2="80"/><line x1="372" y1="150" x2="480" y2="150"/><line x1="372" y1="220" x2="480" y2="220"/>
</g>
<g fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round">
<polyline points="372,80 376.5,72 381,66 385.5,64 390,66 394.5,72 399,80 403.5,88 408,94 412.5,96 417,94 421.5,88 426,80 430.5,72 435,66 439.5,64 444,66 448.5,72 453,80 457.5,88 462,94 466.5,96 471,94 475.5,88 480,80"/>
<polyline points="372,150 376.5,142 381,136 385.5,134 390,136 394.5,142 399,150 426,150 430.5,142 435,136 439.5,134 444,136 448.5,142 453,150 480,150"/>
<polyline points="372,206 480,206"/>
</g>
<g font-size="13" fill="#183043">
<text x="496" y="77">AC sine wave: Type AC, Type A</text><text x="496" y="94">and Type B all detect</text>
<text x="496" y="147">Pulsed DC: Type A and</text><text x="496" y="164">Type B detect</text>
<text x="496" y="217">Smooth DC above 6 mA: Type B,</text><text x="496" y="234">or a charger with built-in RDC-DD</text>
</g>
</svg>`;

ART.protection=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 260" width="100%" style="height:auto;max-width:720px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>Front view of an EV distribution board with a main switch, surge protection, one RCBO per charger and two spare ways, cables leaving to three chargers</title>
<rect x="24" y="24" width="672" height="148" rx="10" fill="#122b3e"/>
<text x="40" y="46" font-size="13" fill="#ffffff">EV distribution board (EVDB)</text>
<rect x="36" y="54" width="648" height="110" rx="6" fill="#ffffff"/>
<g fill="#f5f7fa" stroke="#3b5a74" stroke-width="1.5">
<rect x="48" y="62" width="86" height="94" rx="6"/><rect x="138" y="62" width="86" height="94" rx="6"/><rect x="228" y="62" width="86" height="94" rx="6"/><rect x="318" y="62" width="86" height="94" rx="6"/><rect x="408" y="62" width="86" height="94" rx="6"/><rect x="498" y="62" width="86" height="94" rx="6"/><rect x="588" y="62" width="86" height="94" rx="6"/>
</g>
<g fill="#122b3e">
<rect x="76" y="70" width="30" height="12" rx="3"/><rect x="166" y="70" width="30" height="12" rx="3"/><rect x="256" y="70" width="30" height="12" rx="3"/><rect x="346" y="70" width="30" height="12" rx="3"/><rect x="436" y="70" width="30" height="12" rx="3"/>
</g>
<g fill="#d4e99b" stroke="#3b5a74" stroke-width="1">
<rect x="294" y="70" width="14" height="10" rx="2"/><rect x="384" y="70" width="14" height="10" rx="2"/><rect x="474" y="70" width="14" height="10" rx="2"/>
</g>
<g font-size="12" fill="#183043" text-anchor="middle">
<text x="91" y="104">Main switch</text><text x="91" y="120">100 A</text>
<text x="181" y="104">SPD</text><text x="181" y="120">Type 2</text>
<text x="271" y="104">RCBO 40 A</text><text x="271" y="120">Type A 30 mA</text><text x="271" y="138" font-weight="700">Charger 1</text>
<text x="361" y="104">RCBO 40 A</text><text x="361" y="120">Type A 30 mA</text><text x="361" y="138" font-weight="700">Charger 2</text>
<text x="451" y="104">RCBO 40 A</text><text x="451" y="120">Type A 30 mA</text><text x="451" y="138" font-weight="700">Charger 3</text>
<text x="541" y="112" fill="#586e80">Spare</text><text x="631" y="112" fill="#586e80">Spare</text>
</g>
<g stroke="#122b3e" stroke-width="2">
<line x1="271" y1="172" x2="271" y2="190"/><line x1="361" y1="172" x2="361" y2="190"/><line x1="451" y1="172" x2="451" y2="190"/>
</g>
<g fill="#122b3e">
<rect x="257" y="190" width="28" height="38" rx="5"/><rect x="347" y="190" width="28" height="38" rx="5"/><rect x="437" y="190" width="28" height="38" rx="5"/>
</g>
<g fill="#d4e99b">
<rect x="263" y="198" width="16" height="8" rx="1.5"/><rect x="353" y="198" width="16" height="8" rx="1.5"/><rect x="443" y="198" width="16" height="8" rx="1.5"/>
</g>
<text x="360" y="252" font-size="13" fill="#586e80" text-anchor="middle">One dedicated circuit and one protective device for every charger.</text>
</svg>`;

ART.tour1=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" style="height:auto;max-width:320px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>A picture being added to the canvas</title>
<rect x="0" y="0" width="320" height="180" rx="12" fill="#f5f7fa"/>
<rect x="60" y="22" width="200" height="136" rx="10" fill="#122b3e"/>
<rect x="112" y="48" width="84" height="64" rx="6" fill="#ffffff"/>
<polygon points="118,106 142,76 158,92 170,80 190,106" fill="#3b5a74"/>
<circle cx="178" cy="64" r="7" fill="#d4e99b"/>
<circle cx="206" cy="104" r="18" fill="#d4e99b" stroke="#122b3e" stroke-width="2"/>
<path d="M198 104H214M206 96V112" stroke="#122b3e" stroke-width="3" stroke-linecap="round"/>
<text x="160" y="142" font-size="12" fill="#ffffff" text-anchor="middle">Add a photo or plan</text>
</svg>`;

ART.tour2=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" style="height:auto;max-width:320px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>A ruler laid across a parking bay reading 4.8 metres</title>
<rect x="0" y="0" width="320" height="180" rx="12" fill="#f5f7fa"/>
<rect x="60" y="22" width="200" height="136" rx="10" fill="#122b3e"/>
<rect x="92" y="52" width="136" height="66" rx="3" fill="none" stroke="#ffffff" stroke-width="2"/>
<rect x="84" y="74" width="152" height="22" rx="3" fill="#d4e99b" stroke="#122b3e" stroke-width="1"/>
<path d="M92 74V84M108 74V79M124 74V84M140 74V79M156 74V84M172 74V79M188 74V84M204 74V79M220 74V84" stroke="#122b3e" stroke-width="1.5"/>
<text x="160" y="92" font-size="13" font-weight="700" fill="#163322" text-anchor="middle">4.8 m</text>
<text x="160" y="142" font-size="12" fill="#ffffff" text-anchor="middle">Measure the bays</text>
</svg>`;

ART.tour3=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" style="height:auto;max-width:320px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>A charger and a dashed cable route being placed with a cursor</title>
<rect x="0" y="0" width="320" height="180" rx="12" fill="#f5f7fa"/>
<rect x="60" y="22" width="200" height="136" rx="10" fill="#122b3e"/>
<rect x="92" y="46" width="30" height="50" rx="6" fill="#ffffff"/>
<rect x="99" y="54" width="16" height="10" rx="2" fill="#d4e99b"/>
<polyline points="122,86 150,86 150,118 206,118" fill="none" stroke="#d4e99b" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round"/>
<polygon points="206,108 206,132 212,126 218,136 222,134 216,124 224,124" fill="#ffffff" stroke="#122b3e" stroke-width="1"/>
<text x="160" y="150" font-size="12" fill="#ffffff" text-anchor="middle">Place chargers and cable runs</text>
</svg>`;

ART.tour4=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="100%" style="height:auto;max-width:320px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>A PDF document with a download arrow and a tick</title>
<rect x="0" y="0" width="320" height="180" rx="12" fill="#f5f7fa"/>
<rect x="60" y="22" width="200" height="136" rx="10" fill="#122b3e"/>
<rect x="120" y="36" width="80" height="90" rx="6" fill="#ffffff"/>
<polygon points="184,36 200,52 184,52" fill="#c8d4df"/>
<g fill="#c8d4df">
<rect x="132" y="70" width="56" height="4" rx="2"/><rect x="132" y="82" width="56" height="4" rx="2"/><rect x="132" y="94" width="40" height="4" rx="2"/>
</g>
<rect x="128" y="46" width="34" height="15" rx="3" fill="#d4e99b"/>
<text x="145" y="58" font-size="12" font-weight="700" fill="#163322" text-anchor="middle">PDF</text>
<circle cx="206" cy="112" r="18" fill="#d4e99b" stroke="#122b3e" stroke-width="2"/>
<path d="M206 102V120M198 113L206 121L214 113" fill="none" stroke="#122b3e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="112" cy="112" r="14" fill="#4ba069"/>
<polyline points="105,112 110,117 119,107" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<text x="160" y="148" font-size="12" fill="#ffffff" text-anchor="middle">Export the report</text>
</svg>`;

ART['survey-photo']=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="100%" style="height:auto;max-width:320px;display:block" role="img" font-family="'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif">
<title>A phone camera frame around a cut-out fuse box, labelled main fuse 100 A</title>
<rect x="0" y="0" width="320" height="200" rx="12" fill="#f5f7fa"/>
<rect x="40" y="14" width="240" height="172" rx="10" fill="#122b3e"/>
<g fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round">
<polyline points="56,52 56,30 78,30"/><polyline points="242,30 264,30 264,52"/><polyline points="56,148 56,170 78,170"/><polyline points="242,170 264,170 264,148"/>
</g>
<line x1="160" y1="40" x2="160" y2="54" stroke="#3b5a74" stroke-width="4"/>
<line x1="160" y1="136" x2="160" y2="150" stroke="#3b5a74" stroke-width="4"/>
<rect x="118" y="54" width="84" height="82" rx="6" fill="#ffffff" stroke="#c8d4df" stroke-width="2"/>
<rect x="144" y="70" width="32" height="50" rx="4" fill="#284459"/>
<circle cx="160" cy="84" r="4" fill="#d4e99b"/>
<text x="160" y="110" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">100</text>
<rect x="92" y="154" width="136" height="24" rx="8" fill="#d4e99b"/>
<text x="160" y="171" font-size="13" font-weight="700" fill="#163322" text-anchor="middle">Main fuse 100 A</text>
</svg>`;

window.EVGuideArt=ART;
})();
