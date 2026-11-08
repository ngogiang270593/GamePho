export { OPENING_MAP_REST_POINT } from '../game/openingMap';

export function OpeningMapNpcHomes({ simplified = false }: { simplified?: boolean }) {
  return <g className={`opening-map-npc-homes${simplified ? ' is-simplified' : ''}`}>
    <g data-scenery-cluster="herb-and-crafts">
      <g data-landmark="herbalist-shop" transform="translate(1370 1275)">
        <ellipse cx="145" cy="193" rx="180" ry="31" fill="#435b3d" opacity=".18" />
        <path d="M15 102h250v86H15Z" fill="#a88a5d" stroke="#674f37" strokeWidth="7" />
        <path d="M27 109h224v66H27Z" fill="#d4bc87" stroke="#826841" strokeWidth="4" />
        <path d="M0 94 124 17 281 94 263 116 125 51 18 115Z" fill="#837448" stroke="#554f36" strokeWidth="7" />
        <path d="M12 93q36-29 71-23 27-27 56-3 31-22 60 4 36-9 68 23" fill="none" stroke="#60794a" strokeWidth="12" strokeLinecap="round" />
        <path d="M27 91q36-19 65-10m21-5q28-20 54 1m36 8q28-13 51 8" fill="none" stroke="#a9b574" strokeWidth="5" strokeLinecap="round" />
        <path d="M41 107v79m202-79v79M54 120h176" stroke="#6c563b" strokeWidth="7" />
        <path d="M56 157h69v30H56Z" fill="#604c35" stroke="#9d8053" strokeWidth="4" />
        <path d="M63 163h55m-55 8h55m-55 8h55m-45-16v24m18-24v24m18-24v24" stroke="#c3a36a" strokeWidth="2" />
        <g transform="translate(178 158)">
          <path d="M0 14h74v8H0Zm7 8v29m60-29v29" fill="#795a3a" stroke="#594432" strokeWidth="3" />
          <path d="M3 11q33-13 68 0l-4 14q-31 10-60 0Z" fill="#bb9d61" stroke="#765c39" strokeWidth="3" />
          <path d="M14 9q-7-15 2-23 9 10 5 23m12 0q-2-18 9-25 8 15 0 25m13 1q2-14 14-18 3 12-7 19" fill="#6d8b54" stroke="#4f7049" strokeWidth="2" />
        </g>
        <g transform="translate(8 165)"><path d="M0 14h30v33H0Z" fill="#573f31" stroke="#3f352b" strokeWidth="3" /><path d="M5 18h20m-20 7h20m-20 7h20m-20 7h20" stroke="#a77f4e" strokeWidth="2" /><circle cx="23" cy="21" r="2" fill="#d8b96d" /></g>
        <g className="scenery-herb-smoke" transform="translate(237 148)" fill="none" stroke="#e9ddbd" strokeWidth="5" strokeLinecap="round">
          <path d="M0 0q-9-13 2-23t-2-24" opacity=".72" /><path d="M13 1q11-12 1-24t5-37" opacity=".48" />
        </g>
        <text x="137" y="215" textAnchor="middle">Y QUÁN · THUỐC NAM</text>
      </g>

      <g data-landmark="toy-stall" transform="translate(1760 1650)">
        <ellipse cx="118" cy="126" rx="140" ry="25" fill="#435b3d" opacity=".16" />
        <path d="M15 68h208v49H15Z" fill="#9a7650" stroke="#604a36" strokeWidth="5" />
        <path d="M24 75h190v30H24Z" fill="#4a5960" />
        <path d="M20 69h196M29 78v32m176-32v32" stroke="#d0b77f" strokeWidth="4" />
        {[54, 91, 131, 171].map((x, index) => <g key={`toy-${index}`} transform={`translate(${x} 61)`}>
          <path d="M0 0v-48" stroke="#775638" strokeWidth="3" />
          <path d={index % 2 ? 'M-13-43q13-19 26 0l-5 17H-8Z' : 'M-14-36q14-24 28 0L6-18H-8Z'} fill={['#cb5848', '#e4be4e', '#4f8d68', '#d87946'][index]} stroke="#6f523d" strokeWidth="2" />
          <circle cy="-38" r="4" fill="#f3d982" /><path d="M-5-28h10" stroke="#f4e6b7" strokeWidth="2" />
        </g>)}
        <g transform="translate(63 5)"><path d="M0 0q33-46 66 0v30H0Z" fill="#d8b98a" stroke="#785f40" strokeWidth="3" /><path d="M33 0v29M10 4l23 24M56 4 33 28M4 13l29 15m29-15L33 28" stroke="#9c7951" strokeWidth="2" /></g>
        <path d="M23 118h194" stroke="#6b5238" strokeWidth="6" />
        <text x="119" y="147" textAnchor="middle">TÒ HE · QUẠT GIẤY</text>
      </g>
    </g>

    <g data-scenery-cluster="market-and-tavern">
      <g data-landmark="road-lanterns" fill="none" strokeLinecap="round">
        <path d="M2210 1320v-46m177 36v-49m176 88v-54" stroke="#70573a" strokeWidth="5" />
        <g className="scenery-lantern">
          <path d="M2194 1265h32l-3 42q-13 13-26 0Z" fill="#b94d3d" stroke="#684735" strokeWidth="3" /><path d="M2198 1273h24m-23 11h22m-21 11h20" stroke="#e8bd72" strokeWidth="3" /><path d="M2210 1308v12" stroke="#cfaa69" strokeWidth="3" />
          <path d="M2370 1258h32l-3 42q-13 13-26 0Z" fill="#d19a48" stroke="#684735" strokeWidth="3" /><path d="M2374 1266h24m-23 11h22m-21 11h20" stroke="#f1d58a" strokeWidth="3" /><path d="M2386 1301v12" stroke="#cfaa69" strokeWidth="3" />
          <path d="M2545 1289h32l-3 42q-13 13-26 0Z" fill="#b94d3d" stroke="#684735" strokeWidth="3" /><path d="M2549 1297h24m-23 11h22m-21 11h20" stroke="#e8bd72" strokeWidth="3" /><path d="M2561 1332v12" stroke="#cfaa69" strokeWidth="3" />
        </g>
      </g>
      <g data-landmark="inn-stall" transform="translate(2170 1595)">
        <path d="M8 62h242v11H8Zm19 11v85m204-85v85" fill="#71543a" stroke="#544330" strokeWidth="5" />
        <path d="M-7 60 25 8h197l35 52Z" fill="#95744d" stroke="#604a35" strokeWidth="5" />
        <path d="M4 58q21-10 42 0t42 0 42 0 42 0 42 0 42 0l-5 17q-19-8-38 0t-38 0-38 0-38 0-38 0-38 0l-20-2Z" fill="#b49a68" stroke="#6d5537" strokeWidth="3" />
        <path d="M25 25h197M49 10l-18 48m62-48-4 49m57-49 10 49m43-49 21 49" stroke="#d4bd87" strokeWidth="3" opacity=".75" />
        {[22, 105, 187].map((x, index) => <g key={`table-${index}`} transform={`translate(${x} 110)`}>
          <path d="M0 0h62v9H0Zm7 9v35m49-35v35" fill="#956d45" stroke="#594532" strokeWidth="4" />
          <path d="M6-4q24-9 50 0v12Q30 17 6 8Z" fill="#d0b77e" stroke="#775e3d" strokeWidth="3" />
          <path d="M20-3q-7-12 1-20 8 8 3 20m13 0q-1-12 8-18 7 11 0 18" fill="#71905a" />
        </g>)}
        <g transform="translate(83 83)">
          <path d="M0 0h46v25H0Z" fill="#bba477" stroke="#66523b" strokeWidth="4" /><path d="M-4 0h54" stroke="#5d4935" strokeWidth="6" />
          <path className="scenery-steam" d="M12-2q-8-13 1-22t-1-23m18 44q10-12 2-22t6-28" fill="none" stroke="#fff1d2" strokeWidth="4" strokeLinecap="round" />
        </g>
        <text x="126" y="180" textAnchor="middle">QUÁN CƠM NƯỚC</text>
      </g>
      <g data-landmark="wine-house" transform="translate(2475 1410)">
        <ellipse cx="132" cy="194" rx="159" ry="29" fill="#38483b" opacity=".18" />
        <path d="M22 84h218v100H22Z" fill="#49382f" stroke="#2f2e29" strokeWidth="7" />
        <path d="M34 97h194v72H34Z" fill="#694739" stroke="#a17c55" strokeWidth="4" />
        <path d="M8 81 126 7 255 81 238 101 125 39 24 102Z" fill="#39332f" stroke="#282a27" strokeWidth="7" />
        <path d="M25 82 126 22l112 63M49 91h165" fill="none" stroke="#977554" strokeWidth="4" />
        <path d="M48 101v69m167-69v69" stroke="#372f2a" strokeWidth="8" />
        <path d="M104 120v45m70-45v45m-70-34h70" stroke="#a17c55" strokeWidth="3" />
        <path d="M100 121q18-20 37 0v44h-37Zm72 0q18-20 37 0v44h-37Z" fill="#302b29" stroke="#b28868" strokeWidth="3" />
        <path className="scenery-silk" d="M105 121q14 9 30 0v39q-12 9-30 0Zm72 0q15 9 30 0v39q-13 9-30 0Z" fill="#d8949b" opacity=".82" />
        <path d="M109 130q11 7 22 0m-22 9q11 7 22 0m50-9q11 7 22 0m-22 9q11 7 22 0" fill="none" stroke="#f0c4b8" strokeWidth="2" />
        <path d="M70 87h119v10H70Z" fill="#82523f" stroke="#332d29" strokeWidth="3" />
        <text x="130" y="208" textAnchor="middle">TỬU LÂU HAI TẦNG</text>
      </g>
      <g data-landmark="fruit-baskets" transform="translate(2190 1330)">
        <path d="M0 18q38-19 70 0l-5 43H8Z" fill="#a67b48" stroke="#664d35" strokeWidth="4" />
        <path d="M5 27q31 10 60 0m-56 12q27 10 53 0m-51 12q25 9 48 0" fill="none" stroke="#e0c58b" strokeWidth="3" />
        <g fill="#c94c3f" stroke="#803e32" strokeWidth="2"><circle cx="16" cy="12" r="10" /><circle cx="35" cy="8" r="11" /><circle cx="54" cy="13" r="10" /><circle cx="25" cy="-4" r="9" /></g>
        <g fill="#d5aa54" stroke="#8c693e" strokeWidth="2"><circle cx="93" cy="19" r="10" /><circle cx="112" cy="12" r="11" /><circle cx="130" cy="20" r="10" /><circle cx="105" cy="-3" r="9" /></g>
        <path d="m8 7 23-22m27 28 19-17m17 16 24-20m15 26 16-15" stroke="#647c4c" strokeWidth="4" />
        <path d="M-7 62h148" stroke="#71543a" strokeWidth="5" />
      </g>
    </g>

    <g data-scenery-cluster="river-and-pasture">
      <g data-landmark="river-reeds" className="scenery-riverbank" fill="none" strokeLinecap="round">
        <path d="M3040 850q-13-54-43-91m59 94q23-51 19-99m-5 120q41-41 56-83m-110 156q-22-47-51-64m93 64q32-45 44-86m57 122q26-40 56-53" stroke="#6c8853" strokeWidth="8" />
        <path d="M2997 766v-28m75 29v-38m59 25v-26m-142 111v-26m112 15v-31m76 66v-26" stroke="#b5a36d" strokeWidth="8" />
        <path d="M3060 970q45-20 85 1m-118 42q30-12 56 1m67 28q32-14 58 2" stroke="#dfebc7" strokeWidth="4" opacity=".8" />
      </g>
      <g data-landmark="water-hyacinth" className="scenery-water-plants">
        {[[3070, 1130], [3006, 1196], [3102, 1260], [3025, 1815], [3070, 1870], [3000, 2070], [3080, 2140]].map(([x, y], index) => <g key={`hyacinth-${index}`} transform={`translate(${x} ${y})`}>
          <ellipse rx="25" ry="10" fill="#557c61" stroke="#d2dda0" strokeWidth="2" /><path d="M0 1q-20-2-19-17 13 0 19 17m0 0q20-2 19-17Q6-15 0 1" fill="#738d66" /><circle cx="-10" cy="-17" r="4" fill="#ad8db0" /><circle cx="-3" cy="-20" r="4" fill="#c2a2c2" /><circle cx="5" cy="-18" r="4" fill="#ad8db0" />
        </g>)}
      </g>
      <g data-landmark="buffalo-pasture" data-nearby-npc="herdboy-a-sang" transform="translate(2360 820)">
        <path d="M0 123q86-91 191-19-36 81-161 74Z" fill="#79915e" stroke="#556f4e" strokeWidth="5" />
        <path d="M42 130q4-38 51-42 47-4 58 31l-9 33H52Z" fill="#767c75" stroke="#454a44" strokeWidth="5" />
        <path d="M137 105q31-31 50-7l-4 28-35 9m-86-34q-16-16-28 1m7-7q-17-24-30-13m162-2q18-23 29-8" fill="#858a80" stroke="#454a44" strokeWidth="5" strokeLinejoin="round" />
        <path d="M63 148v24m63-22v23m-40-54q22 9 47 0" stroke="#454a44" strokeWidth="6" strokeLinecap="round" />
        <path d="M25 116q12-25 22-30m13 26q7-25 20-31m64 13 17-28" stroke="#d4d69a" strokeWidth="4" strokeLinecap="round" />
        <path d="M7 176q22-10 42 0m77 7q22-10 42 0" stroke="#d6dba2" strokeWidth="4" />
        <path d="M25 106q34 4 46-5l-2 15q-24 8-44 1Z" fill="#c4a66e" stroke="#735d3f" strokeWidth="3" />
        <path d="M5 172h36l-4 7H9Z" fill="#c5a873" stroke="#755e3e" strokeWidth="3" />
        <text x="91" y="209" textAnchor="middle">BÃI TRÂU VEN SÔNG</text>
      </g>
    </g>

    <g data-scenery-cluster="forge-and-training">
      <g data-landmark="forge" transform="translate(2555 1290)">
        <ellipse cx="109" cy="177" rx="143" ry="30" fill="#3f4537" opacity=".2" />
        <path d="M9 85h201v83H9Z" fill="#9b7955" stroke="#604b36" strokeWidth="6" />
        <path d="M-5 82 105 13 230 82 211 102 105 46 12 102Z" fill="#8c6045" stroke="#594332" strokeWidth="6" />
        <path d="M17 86 106 31l103 57" fill="none" stroke="#d2ac70" strokeWidth="4" />
        <path d="M30 94v76m160-76v76" stroke="#644a35" strokeWidth="8" />
        <path d="M68 116h85v45H68Z" fill="#493c32" stroke="#2f302b" strokeWidth="5" />
        <path d="M77 151q-15-35 8-45 8 20 17 8 15-24 23 1 11-23 24 2 17 13 1 34Z" fill="#bd5535" />
        <path className="scenery-forge-flame" d="M85 148q-7-19 8-29 1 14 9 9 6-16 13-2 8-11 13 3 12 8 4 19Z" fill="#f1c15f" />
        <path d="M89 151h50m-43-8h37" stroke="#e98243" strokeWidth="4" />
        <path d="M89 108 69 85m86 23 22-27" stroke="#594b39" strokeWidth="7" />
        <path d="M58 91 45 67m143 23 13-24" stroke="#7d6646" strokeWidth="5" />
        <path d="M73 109h-31m123 0h32" stroke="#b69661" strokeWidth="5" />
        <path d="M176 145h36v22h-36Z" fill="#70543c" stroke="#493d31" strokeWidth="4" />
        <path className="scenery-forge-smoke" d="M103 81q-12-17 1-29t-3-31m25 59q12-16 2-28t6-30" fill="none" stroke="#d9c8a9" strokeWidth="4" strokeLinecap="round" />
        <text x="107" y="198" textAnchor="middle">LÒ RÈN THIẾT CHỦY</text>
      </g>
      <g data-landmark="training-yard" transform="translate(2160 665)">
        <path d="M-186 43q181-45 376 2l-25 79q-165 35-334-1Z" fill="#b58761" stroke="#795b42" strokeWidth="5" />
        <path d="M-163 56q163-36 324 1m-319 17q151-33 310 2m-305 17q148-30 298 1" fill="none" stroke="#dfbf88" strokeWidth="4" />
        {[-112, -46, 37, 116].map((x, index) => <g key={`training-post-${index}`} transform={`translate(${x} 35)`}>
          <path d="M0 0v84" stroke="#77563b" strokeWidth="8" /><path d="M-14 9h28m-28 13h28m-28 13h28m-28 13h28m-28 13h28" stroke="#c49b63" strokeWidth="4" />
          {index === 0 || index === 3 ? <path d="M-19 16q19-15 38 0v31q-17 14-38 0Z" fill="#9b5846" stroke="#5d4635" strokeWidth="4" /> : <path d="M-23 0 0-13 23 0 0 11Z" fill="#b49159" stroke="#594837" strokeWidth="3" />}
        </g>)}
        <g transform="translate(178 4)"><path d="M0 0v95m-21-84h42m-35 14h28m-20 14h16" stroke="#69543c" strokeWidth="6" /><path d="M-15 2q15-13 30 0l-3 26q-12 9-24 0Z" fill="#b75842" stroke="#654532" strokeWidth="3" /></g>
        <text x="0" y="148" textAnchor="middle">SÂN LUYỆN ĐAO · GỐC ĐA</text>
      </g>
    </g>

    <g data-scenery-cluster="western-forest">
      <g data-landmark="woodcutter-hut" transform="translate(650 1060)">
        <ellipse cx="117" cy="194" rx="146" ry="30" fill="#354a3c" opacity=".22" />
        <path d="M12 105h216v77H12Z" fill="#66503a" stroke="#423c31" strokeWidth="6" />
        <path d="M0 103 104 31 246 104 226 122 104 69 16 121Z" fill="#564437" stroke="#332f29" strokeWidth="6" />
        <path d="M14 101 103 45l119 60" fill="none" stroke="#a48858" strokeWidth="4" />
        <path d="M34 111v69m166-68v69" stroke="#493a2e" strokeWidth="8" />
        <path d="M93 128h43v53H93Z" fill="#342e29" stroke="#967a50" strokeWidth="4" />
        <path d="M101 134v42m11-42v42m12-42v42" stroke="#bd9b61" strokeWidth="3" />
        {[0, 1, 2].map(row => <g key={`firewood-${row}`} transform={`translate(${154 + row * 9} ${156 - row * 19})`}>
          <path d="M0 0h60" stroke="#b08552" strokeWidth="12" strokeLinecap="round" /><path d="M3-4v8m52-8v8" stroke="#e0c58d" strokeWidth="3" />
        </g>)}
        <path d="M40 95 70 43m-14-7 29 18m-46-6 28 22" stroke="#9c9b8a" strokeWidth="7" strokeLinecap="round" />
        <path d="M57 47 83 63m-20-27 29 17" stroke="#594638" strokeWidth="4" />
        <text x="117" y="214" textAnchor="middle">LỀU TIỀU PHU · CỦI KHÔ</text>
      </g>
      <g data-landmark="ruined-wall" data-nearby-npc="beggar-hac-lao" transform="translate(1570 1260)">
        <path d="M0 84v-53l38-8v22l33-8V5l40-5v31l38-6V14l49-8v85Z" fill="#69675a" stroke="#423f37" strokeWidth="6" />
        <path d="M8 54h35m-29 15h39m3-35h30m-25 17h36m8-30h31m-30 15h37m10 23h39" stroke="#b6a37b" strokeWidth="5" />
        <path d="M22 82q24-22 48-5 21-22 45-3 27-18 51-2" fill="none" stroke="#547650" strokeWidth="8" />
        <path d="M22 91h181" stroke="#a58a61" strokeWidth="9" strokeDasharray="9 7" />
        <path d="M50 104q8-11 16 0l-2 17H52Zm85 1q8-12 16 0l-2 16h-13Z" fill="#95846b" stroke="#554a3b" strokeWidth="3" />
        <path d="M90 119 117 91l7 4-23 30" stroke="#876946" strokeWidth="6" strokeLinecap="round" />
        <text x="104" y="143" textAnchor="middle">GÓC TƯỜNG RÊU PHONG</text>
      </g>
      <g data-landmark="poison-cave" transform="translate(480 1600)">
        <path d="M0 117q4-105 74-117 66 12 78 117Z" fill="#393b36" stroke="#272d2b" strokeWidth="7" />
        <path d="M19 116q8-68 55-84 47 18 58 84Z" fill="#242b2a" />
        <path d="M-9 117h171" stroke="#746247" strokeWidth="9" />
        <path d="M46 111q4-37 34-40 34 8 37 40l-8 19H55Z" fill="#454b42" stroke="#262f2b" strokeWidth="4" />
        <path d="M55 108q24-14 50 0l-4 14H59Z" fill="#81567a" />
        <path className="scenery-poison-smoke" d="M72 98q-12-16 2-26t0-22m20 46q10-13 1-22t5-24" fill="none" stroke="#b69abd" strokeWidth="5" strokeLinecap="round" />
        <g fill="#776346" stroke="#463e31" strokeWidth="3"><path d="M21 57q-15-24 3-31l11 8-3 24Zm117-19q15-21 27-2l-5 23-21-4Z" /><path d="M26 112q13-22 25-2m83 1q12-18 23-1" fill="none" /></g>
        <text x="75" y="-10" textAnchor="middle">HANG ĐỘC BÀ</text>
      </g>
      <g className="scenery-forest-mist" fill="#b5c3a0">
        <path d="M290 1420q92-45 181 0t180 0 180 0 180 0v77H290Z" opacity=".13" />
        <path d="M345 1770q110-38 216 0t208 0 180 0v53H345Z" opacity=".11" />
      </g>
    </g>

    <g data-scenery-cluster="village-gate">
      <g data-landmark="outer-watchtower" transform="translate(2870 1110)">
        <ellipse cx="83" cy="237" rx="112" ry="25" fill="#34453a" opacity=".2" />
        <path d="M24 224V75m119 149V75" stroke="#665039" strokeWidth="13" />
        <path d="M27 113h113m-113 15h113m-105 14v78m34-78v78m35-78v78m31-78v78" stroke="#a88450" strokeWidth="5" />
        <path d="M4 79h159v14H4Z" fill="#ba9b63" stroke="#68533b" strokeWidth="5" />
        <path d="M-7 77 83 29l93 48-14 16-79-39L8 94Z" fill="#514438" stroke="#342f2a" strokeWidth="6" />
        <path d="M16 74 83 39l73 37" fill="none" stroke="#c1a06b" strokeWidth="4" />
        <path d="M65 15h39v42H65Z" fill="#71563a" stroke="#43372d" strokeWidth="4" />
        <path d="M70 20h29v32H70Z" fill="#a05242" /><path d="M74 26h21m-21 8h21m-21 8h21" stroke="#ead39a" strokeWidth="3" />
        <path d="M93 30v-37m0 0 33 8-33 7" fill="#a7473d" stroke="#674538" strokeWidth="3" />
        <path d="M-14 231h195" stroke="#8d7048" strokeWidth="11" />
        <text x="82" y="260" textAnchor="middle">THÁP CANH CẦU GỖ</text>
      </g>
      <g data-landmark="roadside-hideout" transform="translate(2935 1690)">
        <path d="M0 34q10-30 37-21 16-26 38-8 26-19 43 2 25-12 42 8 27-9 34 19v41H0Z" fill="#486947" stroke="#36533f" strokeWidth="4" />
        <path d="M14 42q25-20 48-8m19-8q29-13 49 9m17-2q24-12 41 6" fill="none" stroke="#9eb371" strokeWidth="6" strokeLinecap="round" />
        <path d="M55 66h89v40H55Z" fill="#8a6c45" stroke="#514331" strokeWidth="4" />
        <path d="M61 71h77v28H61Z" fill="#a78654" /><path d="M69 75v20m15-20v20m15-20v20m15-20v20m15-20v20" stroke="#dfc48a" strokeWidth="3" />
        <path d="M64 65h70v-11H64Z" fill="#9c7950" stroke="#594734" strokeWidth="3" />
        <path d="M32 13h36v31H32Z" fill="#7b6546" stroke="#514532" strokeWidth="3" /><path d="M37 18v21m9-21v21m9-21v21" stroke="#c2a36a" strokeWidth="2" />
        <g data-detail="acau-broken-cot">
          <path d="M30 95h61v7H30Zm6 7v24m48-24v24m-48-1h43" fill="none" stroke="#b49462" strokeWidth="5" strokeLinecap="round" />
          <path d="M38 99h44v18H38Z" fill="#70573f" stroke="#443a30" strokeWidth="3" />
          <path d="M43 103h34m-29 5h24m-22 5h20" stroke="#c6ac7d" strokeWidth="2" />
        </g>
        <g data-detail="acau-bowls-and-note" transform="translate(14 105)"><path d="M0 0h15v14H0Z" fill="#877c68" stroke="#51483c" strokeWidth="2" /><path d="M2 4h11m-10 4h9" stroke="#cec0a4" strokeWidth="2" /></g>
        <text x="99" y="28" textAnchor="middle">GẦM CẦU · A CẨU</text>
      </g>
    </g>

    <g data-scenery-cluster="outlaw-hideouts">
      <g data-landmark="black-wolf-lair" transform="translate(1030 1515)">
        <path d="M-25 164q83-34 166 4t169-3v53q-98 31-180-5t-155 6Z" fill="#514b3d" opacity=".58" />
        <path d="M3 182q73-21 134 5m31-2q52-16 108 5" fill="none" stroke="#84795f" strokeWidth="5" strokeDasharray="8 12" opacity=".72" />
        <path d="M36 85h226v100H36Z" fill="#463f37" stroke="#302e2a" strokeWidth="6" />
        <path d="M20 88 81 31l193 15 24 48-20 15-24-36-172-10-40 42Z" fill="#51433b" stroke="#332f2b" strokeWidth="6" />
        <path d="m32 80 37 10-12 56-29-5Zm161-32 44 5-15 58-38-9Z" fill="#74644d" stroke="#3b3630" strokeWidth="4" />
        <path d="M48 99v81m187-74v79m-163-62v58m24-58v58" stroke="#75593d" strokeWidth="7" />
        <path d="M94 133h83v49H94Z" fill="#684e39" stroke="#342e29" strokeWidth="5" />
        <path d="M103 139q32-8 66 0v34q-35 8-66 0Z" fill="#89704b" />
        <path d="M143 133v-48" stroke="#4d3e31" strokeWidth="8" /><path d="M132 100 149 81 160 91 146 108Z" fill="#9c6054" stroke="#483b34" strokeWidth="3" />
        <path d="M109 145h53m-50 9h46m-49 9h37" stroke="#d3bf91" strokeWidth="3" />
        <path d="M111 138q26-8 48 1m-47 7 47 15m-48-1 48-13" fill="none" stroke="#806c4e" strokeWidth="2" />
        <g transform="translate(190 161)"><path d="M0 5h45v25H0Z" fill="#3d3630" stroke="#756045" strokeWidth="3" /><path d="M5 10h34v15H5Z" fill="#b89857" /><circle cx="13" cy="17" r="3" fill="#e1c47b" /><circle cx="24" cy="17" r="3" fill="#e1c47b" /><circle cx="34" cy="17" r="3" fill="#e1c47b" /></g>
        <g fill="#857560" stroke="#51483c" strokeWidth="3"><path d="M-2 173h23l-2 13H1Zm258-9h25l-3 15h-21Z" /><path d="M2 175q8-11 16 0m242-4q8-12 17 0" fill="none" /></g>
        <g fill="none" stroke="#d3c5a5" strokeWidth="2" opacity=".72">
          <path d="M21 34q12-8 24 0v20m-24-20-10 15m10-15 10 15m-10-15v18m-15-9h31" />
          <path d="M252 26q12-8 24 0v20m-24-20-10 15m10-15 10 15m-10-15v18m-15-9h31" />
        </g>
        <text x="146" y="15" textAnchor="middle">SÀO HUYỆT HẮC LANG</text>
      </g>
    </g>

    <g data-scenery-cluster="poison-swamp">
      <g data-landmark="swamp-pools" className="scenery-swamp">
        <path d="M300 1668q48-43 113-17 43 23 80 0 42-25 77 5-20 45-77 37-41-13-78 12-61 16-115-37Z" fill="#596250" opacity=".78" />
        <path d="M332 1680q32-23 72-7t65 0m42-10q23-13 42 1" fill="none" stroke="#95a17e" strokeWidth="4" opacity=".65" />
        <g className="scenery-swamp-bubbles" fill="none" stroke="#c1b6a0" strokeWidth="3">
          <circle cx="367" cy="1661" r="5" /><circle cx="451" cy="1672" r="4" /><circle cx="520" cy="1653" r="6" />
          <circle cx="367" cy="1661" r="11" opacity=".35" /><circle cx="520" cy="1653" r="12" opacity=".3" />
        </g>
        <path d="M325 1743q29-32 65-10 25 19 47 2 29-19 52 3-10 33-50 28-29-9-53 8-42 9-61-31Z" fill="#666552" opacity=".68" />
        <path d="M346 1747q32-17 58-1m48-6q21-12 37 1" fill="none" stroke="#b09a72" strokeWidth="3" opacity=".58" />
        {[[313, 1615], [568, 1610], [609, 1718], [361, 1786], [646, 1649]].map(([x, y], index) => <g key={`poison-weed-${index}`} transform={`translate(${x} ${y})`}>
          <path d="M0 13q-4-29-18-43m18 43q12-31 31-44m-27 48q-7-23-4-54m7 55q20-18 37-20" fill="none" stroke="#52684a" strokeWidth="5" />
          <path d="M-21-32l8-6m17-9 5-6m19-1 8-4m6 22 8-3" stroke="#85915c" strokeWidth="6" strokeLinecap="round" />
          <path d="M-5-7 5-10m8 14 10-5" stroke="#9e684f" strokeWidth="3" />
        </g>)}
      </g>
      <g data-landmark="witch-cave-details">
        <path d="M466 1588q-8-35 10-57m23 44q20-32 35-45m-8 64q7-33 29-44m-73 1-13-19m37 18 2-23" fill="none" stroke="#665a42" strokeWidth="6" strokeLinecap="round" />
        <g transform="translate(555 1688)">
          <path d="M0 8q18-15 36 0l-4 31H4Z" fill="#443d36" stroke="#292f2c" strokeWidth="4" />
          <path d="M5 13q13-8 26 0l-3 17H8Z" fill="#60565c" />
          <path d="M11 16q6-5 12 0m-9 7q5-4 10 0" fill="none" stroke="#b0a596" strokeWidth="2" />
          <path d="M-5 6q23-13 47 0" fill="none" stroke="#a88655" strokeWidth="3" />
        </g>
        <g transform="translate(436 1725)">
          <path d="M0 0h24v30H0Z" fill="#6d553c" stroke="#382f29" strokeWidth="3" /><path d="M4 5h16v20H4Z" fill="#9b7d53" />
          <path d="M8 9v12m6-12v12" stroke="#41382f" strokeWidth="3" />
        </g>
      </g>
    </g>

    <g data-scenery-cluster="border-cliff">
      <g data-landmark="phuong-cliff" transform="translate(930 730)">
        <path d="M-66 157 12 61 49 75 93-15 137 2 174-64 226-34 272 5 246 68 291 116 255 170Z" fill="#77766b" stroke="#4e514b" strokeWidth="6" />
        <path d="m-20 151 47-80 32 11 42-87 30 18 36-67 42 28 37 33m-199 69 34 8m64-75 24 15m-2 48 33 11" fill="none" stroke="#b7ad94" strokeWidth="6" opacity=".7" />
        <path d="m112 12-29 44 26 19-30 47m104-96-26 35 25 17-28 43m91-108-28 38 25 18-21 38" fill="none" stroke="#4c4942" strokeWidth="7" />
        <path d="M-25 176q80-23 149 1t154-1" fill="none" stroke="#6b5540" strokeWidth="7" strokeDasharray="7 12" />
        <path d="M75 162v-64" stroke="#403b33" strokeWidth="8" /><path d="M59 111 79 83 98 99 79 124Z" fill="#9d4c43" stroke="#4b3932" strokeWidth="4" />
        <path d="M182 168q-45-24-88-1v9q44 22 88 0Z" fill="#564639" stroke="#302f2a" strokeWidth="4" />
        <g transform="translate(217 142)"><path d="M0 3q22-18 44 0l-4 32q-18 14-36 0Z" fill="#806448" stroke="#4b4032" strokeWidth="4" /><path d="M8 5q12-11 25 0" fill="none" stroke="#cfb27a" strokeWidth="3" /><path d="M13 11h18" stroke="#423a31" strokeWidth="3" /></g>
        <text x="132" y="-78" textAnchor="middle">VÁCH ĐÁ · HUYẾT ĐAO PHƯỢNG</text>
      </g>
    </g>

    <g data-scenery-cluster="tax-station">
      <g data-landmark="tax-office" transform="translate(2670 900)">
        <ellipse cx="145" cy="231" rx="183" ry="31" fill="#344238" opacity=".2" />
        <path d="M-18 197h331v27H-18Z" fill="#8f8b7b" stroke="#55534a" strokeWidth="5" />
        <path d="M-5 190h305m-282-10h260m-244-10h226" stroke="#c0bba7" strokeWidth="6" />
        <path d="M27 86h238v101H27Z" fill="#b1a08a" stroke="#4d4a44" strokeWidth="7" />
        <path d="M36 96h220v83H36Z" fill="#d2c1a2" stroke="#81715c" strokeWidth="4" />
        <path d="M8 83 142 6 285 83 265 104 142 39 28 105Z" fill="#554d45" stroke="#393833" strokeWidth="7" />
        <path d="M23 82 142 21l128 64m-227 5h205" fill="none" stroke="#c0a475" strokeWidth="5" />
        <path d="M52 105v78m186-78v78" stroke="#645443" strokeWidth="9" />
        <path d="M103 112h78v75h-78Z" fill="#514437" stroke="#c1a775" strokeWidth="5" />
        <path d="M111 120h62v67h-62Z" fill="#756044" /><path d="M142 120v67m-31-34h62" stroke="#c8ac75" strokeWidth="3" />
        <path d="M106 104h73v12h-73Z" fill="#7e5140" stroke="#433c33" strokeWidth="3" />
        <text x="142" y="113" textAnchor="middle" fill="#f0ddae" fontSize="12">TRẠM THU THUẾ</text>
        <g transform="translate(-1 50)">
          <path d="M0 32V-15m74 47V-15m74 47V-15m74 47V-15m-229-2h307" stroke="#69543b" strokeWidth="4" />
          <path d="M-15-6h28l-3 27q-11 9-22 0Z" fill="#853f3c" stroke="#503c31" strokeWidth="2" />
          <path d="M59-5h28l-3 26q-11 9-22 0Z" fill="#a34c3f" stroke="#503c31" strokeWidth="2" />
          <path d="M133-6h28l-3 27q-11 9-22 0Z" fill="#853f3c" stroke="#503c31" strokeWidth="2" />
          <path d="M207-5h28l-3 26q-11 9-22 0Z" fill="#a34c3f" stroke="#503c31" strokeWidth="2" />
          <path d="M268-4h28l-3 25q-11 9-22 0Z" fill="#853f3c" stroke="#503c31" strokeWidth="2" />
        </g>
        <g transform="translate(268 105)">
          <path d="M0 66V7m18 59V7m36 59V7m18 59V7" stroke="#4f493e" strokeWidth="7" />
          <path d="M-6 10h30m-30 15h30m-30 15h30m22-30h30m-30 15h30m-30 15h30" stroke="#94754c" strokeWidth="5" />
          <path d="M-8 9 2-6 12 9m36 0L58-6 68 9" fill="#96958a" stroke="#464740" strokeWidth="3" />
        </g>
        <g transform="translate(34 184)">
          <path d="M0 0h44v30H0Z" fill="#785b3d" stroke="#473a2e" strokeWidth="4" /><path d="M5 5h34v20H5Z" fill="#b49255" /><path d="M20 7v16m10-16v16" stroke="#735638" strokeWidth="3" />
          <path d="M56 3h43v27H56Z" fill="#644c36" stroke="#40362c" strokeWidth="4" /><path d="M62 7h31v18H62Z" fill="#bda066" /><path d="M78 9v14" stroke="#735638" strokeWidth="3" />
        </g>
        <text x="145" y="-20" textAnchor="middle">CÔNG ĐƯỜNG · QUẢN GIA TRIỆU</text>
      </g>
    </g>

    <g data-npc-homestead="memory-keeper" transform="translate(2820 1900)">
      <ellipse cx="92" cy="106" rx="150" ry="65" fill="#435b3d" opacity=".18" />
      <path d="M-50 79q122-30 260 2l-15 35q-119 23-236-5Z" fill="#bba475" stroke="#917c52" strokeWidth="5" />
      <path d="M-25 67v-54h186v55" fill="#8d7958" stroke="#65563f" strokeWidth="7" />
      <path d="M-30 17 64-43 174 16 153 34 68-4-10 35Z" fill="#b99b65" stroke="#806a48" strokeWidth="6" />
      <path d="M-16 20 64-26 157 20M-9 27 67-17 150 27M3 32 68-8 137 32" fill="none" stroke="#e0c27e" strokeWidth="5" opacity=".85" />
      <path d="M-20 41h173M-18 50h170M-15 59h167M2 32v37m17-35v36m18-38v38m18-39v39m18-39v39m18-37v37m18-34v34m18-29v29" stroke="#d4bd8b" strokeWidth="3" opacity=".8" />
      <path d="M75 41h41v39H75Z" fill="#534638" stroke="#d0b882" strokeWidth="4" />
      <path d="M79 45v32m10-32v32m10-32v32m10-32v32" stroke="#9d8053" strokeWidth="2" />
      <path d="M-60 17v55m-7-55h14m-14 12h14m-14 12h14m-14 12h14m216-38v56" stroke="#755e3f" strokeWidth="6" />
      <path d="M-75 24q30 10 5 35t6 30m16-69q27 10 4 34t5 32" fill="none" stroke="#9b8261" strokeWidth="3" strokeDasharray="4 3" />
      <path d="M-93 29q18 17 35 0m-30 8q14 14 29 0" fill="none" stroke="#dfcfac" strokeWidth="2" />
      <g transform="translate(167 76)"><path d="M0 0h30l-3 31H3Z" fill="#9d7351" stroke="#654d37" strokeWidth="4" /><ellipse cx="15" cy="2" rx="16" ry="5" fill="#c19a66" stroke="#654d37" strokeWidth="3" /><path d="M10 11h10" stroke="#755c3f" strokeWidth="2" /></g>
      <g transform="translate(45 86)"><path d="M0 7h75v8H0Zm7 8v22m61-22v22" fill="#9d714a" stroke="#644d38" strokeWidth="4" /><path d="M5 8v-9h67v9m-64-5h61" fill="none" stroke="#d6b77c" strokeWidth="3" /></g>
      <g transform="translate(126 49)"><path d="M0 23h34v27H0Z" fill="#75624a" stroke="#4e4939" strokeWidth="3" /><path d="M-5 24 17 8 39 24Z" fill="#9c654b" stroke="#5d4838" strokeWidth="3" /><path d="M17 7v-9m-6 10v-8m12 8v-8" stroke="#d2c19c" strokeWidth="2" /></g>
      <text x="66" y="139" textAnchor="middle">MÁI TRANH BẾN THUYỀN</text>
      <text x="80" y="174" textAnchor="middle" className="opening-map-rest-sign">CHÕNG TRE · NGHỈ QUA ĐÊM</text>
    </g>

    <g data-npc-homestead="fisherman-tao" transform="translate(2828 1118)">
      <ellipse cx="118" cy="151" rx="174" ry="52" fill="#445f48" opacity=".17" />
      <path d="M-34 124q120-43 300 4l-21 34q-155 27-263-7Z" fill="#d0b782" stroke="#9e8558" strokeWidth="5" />
      <path d="M-14 20q10-97 70-105 62 8 71 106M4 23Q12-47 57-58q42 9 50 79" fill="none" stroke="#705d3c" strokeWidth="12" />
      <path className="scenery-npc-vối" d="M-39-22q34-50 91-50 59-3 100 48-36 37-99 31-59 5-92-29Z" fill="#52734a" stroke="#3d6046" strokeWidth="6" />
      <path d="M-20-26q35-27 67-24m8 10q41-19 76 7m-125 21q45-16 88-5" fill="none" stroke="#9db36c" strokeWidth="5" opacity=".8" />
      <path d="M30 117V26m77 91V27m-50 90V33" stroke="#765c39" strokeWidth="8" />
      <path d="M11 24 66-15l90 41-18 17-70-29-44 29Z" fill="#b49861" stroke="#725c3d" strokeWidth="6" />
      <path d="M20 24 67-7l76 35M27 29 69 1l65 31m-97 2 97 8" fill="none" stroke="#dfc481" strokeWidth="4" />
      <path d="M18 45h123M22 56h117" stroke="#c6a975" strokeWidth="4" />
      <g transform="translate(166 98)"><path d="M0 10q26-28 50 0l-4 30H5Z" fill="#a7774b" stroke="#694d34" strokeWidth="4" /><path d="M8 11q15-9 31 0m-33 9h43" fill="none" stroke="#e0c186" strokeWidth="3" /></g>
      <g transform="translate(-60 102)"><path d="M0 0h70v33H0Z" fill="#92704c" stroke="#654d37" strokeWidth="4" /><path d="M8 3v27m16-27v27m16-27v27m16-27v27m-55-15h67" stroke="#d1b279" strokeWidth="2" /><path d="M75 5q20-16 34 0m-34 13q20-16 34 0" fill="none" stroke="#9a7652" strokeWidth="3" /></g>
      <g transform="translate(81 100)"><path d="M0 0q25 22 48 0l-7 38H8Z" fill="#b48753" stroke="#72583c" strokeWidth="4" /><path d="M8 8h32m-31 8h30m-29 8h28" stroke="#e4ca94" strokeWidth="2" /></g>
      <path d="M-42 150q13-9 25 0t24 0m18 8q12-9 24 0t25 0m128-16q12-9 24 0t24 0" fill="none" stroke="#fff1d2" strokeWidth="3" opacity=".8" />
      <text x="58" y="183" textAnchor="middle">LỀU CỌC TRE · BẾN CÁ NGẠNH</text>
    </g>

    <g data-npc-homestead="woman-general" transform="translate(1940 438)">
      <ellipse cx="157" cy="221" rx="192" ry="37" fill="#43583e" opacity=".17" />
      <path d="M-22 172q177-31 356 4l-23 42q-155 26-319-7Z" fill="#b99b6d" stroke="#8c754d" strokeWidth="5" />
      <path d="M29 115v-74h150v74m-135-1V54h120v62" fill="#8c7555" stroke="#5f523e" strokeWidth="7" />
      <path d="M12 45 100-18l105 64-18 18-88-46-69 45Z" fill="#654f3f" stroke="#443e35" strokeWidth="6" />
      <path d="M30 43 101-5l90 52m-144-1 67-39 70 40" fill="none" stroke="#b48a5c" strokeWidth="5" />
      <path d="M91 65h33v52H91Z" fill="#3f4035" stroke="#bca578" strokeWidth="4" />
      <path d="M96 69v44m9-44v44m9-44v44" stroke="#a78b59" strokeWidth="2" />
      <path d="M25 119h160m-7 0v26m-137-26v26" stroke="#8e7048" strokeWidth="7" />
      <path d="M-16 152h344M0 137v75m51-70v67m52-70v67m53-67v67m52-64v64m51-60v57m50-55v53" stroke="#927344" strokeWidth="6" />
      <path d="M-18 145h346M-10 166h330M-5 186h320" stroke="#d3b479" strokeWidth="4" />
      <g transform="translate(214 119)"><path d="M0 40V4m24 36V4m-24 9h24m-24 11h24m-24 11h24" stroke="#684e36" strokeWidth="5" /><path d="M0 3h24m-18 0v37" stroke="#d2b579" strokeWidth="2" /></g>
      <g transform="translate(261 107)"><path d="m0 43 24-39 24 39m-42-9h36m-30-10h24m-18-10h12" fill="none" stroke="#806347" strokeWidth="5" /></g>
      <g transform="translate(202 74)"><path d="M0 12h53v20H0Z" fill="#786345" stroke="#524838" strokeWidth="4" /><path d="m11 10 6-7m8 7 6-7m8 7 6-7" stroke="#d2b579" strokeWidth="3" /></g>
      <text x="154" y="236" textAnchor="middle">NHÀ SÀN · SÂN LUYỆN VÕ</text>
    </g>

    <g data-npc-homestead="messenger" transform="translate(2398 1320)">
      <ellipse cx="122" cy="174" rx="149" ry="39" fill="#3d5642" opacity=".17" />
      <path d="M-25 144q113-31 272 5l-20 34q-123 22-242-6Z" fill="#c3a778" stroke="#90774d" strokeWidth="5" />
      <path d="M8 68h194v75H8Z" fill="#b99b6c" stroke="#735d43" strokeWidth="6" />
      <path d="M8 83h194m-182-2v61m21-60v60m140-60v60" stroke="#dfc695" strokeWidth="4" />
      <path d="M-13 67 72 6l116 3 48 62-19 17-41-44-101 3-59 39Z" fill="#625950" stroke="#393d39" strokeWidth="6" />
      <path d="M-3 69 75 17l108 0 42 54M4 75 78 25l100 0 40 52" fill="none" stroke="#938679" strokeWidth="4" />
      <path d="M39 88h34v55H39Zm95 2h34v53h-34Z" fill="#756044" stroke="#4c493b" strokeWidth="4" />
      <path d="M45 94v43m8-43v43m8-43v43m79-42v40m8-40v40m8-40v40" stroke="#c0a475" strokeWidth="2" />
      <path d="M17 68q49 18 95 5 47-13 91 0v17q-48-13-93 1-47 14-93-2Z" fill="#a4624d" stroke="#764939" strokeWidth="4" />
      <path d="M24 77q17 4 34 2m25 1q17 4 34 1m34-4q17 3 33 0" stroke="#d9b48a" strokeWidth="3" />
      <g transform="translate(197 119)"><path d="M0 0h26v29H0Z" fill="#a2794f" stroke="#665039" strokeWidth="4" /><path d="M-3 3h32M2 7v17m9-17v17m9-17v17" stroke="#dfc28a" strokeWidth="2" /><ellipse cx="12" cy="0" rx="15" ry="5" fill="#c09a64" stroke="#665039" strokeWidth="3" /></g>
      <g transform="translate(-15 123)"><path d="M0 0h31v20H0Zm8-11h16v11H8Z" fill="#78634b" stroke="#594d3d" strokeWidth="3" /><path d="M5 8h20m-16 7h12" stroke="#d4bd8a" strokeWidth="2" /></g>
      <g transform="translate(72 111)"><path d="M0 0h67v11H0Zm5 11v27m57-27v27" fill="#73583c" stroke="#4f4635" strokeWidth="4" /><path d="m15 4 9 4m6-4 9 4m6-4 9 4" stroke="#d4b77c" strokeWidth="2" /></g>
      <text x="105" y="208" textAnchor="middle">TIỆM TẠP HÓA · GÓC CHỢ NHỎ</text>
    </g>

    <g data-npc-homestead="gate-guard" transform="translate(2650 1282)">
      <ellipse cx="150" cy="249" rx="195" ry="42" fill="#3c4a3b" opacity=".18" />
      <path d="M-36 202h376v49H-36Z" fill="#a99068" stroke="#786448" strokeWidth="5" />
      <path d="M8 190V52m266 138V52M8 81h266M8 103h266" stroke="#74553a" strokeWidth="12" />
      <path d="M-5 55 142-18 288 55Z" fill="#796650" stroke="#514b3d" strokeWidth="7" />
      <path d="m11 52 131-61 132 61m-242 0 110-51 111 51" fill="none" stroke="#c3a56e" strokeWidth="5" />
      <path d="M18 75h245M20 97h241M31 111v77m42-77v77m42-77v77m42-77v77m42-77v77m42-77v77" stroke="#bb9660" strokeWidth="5" />
      <path d="M-43 213v-80m20 80v-67m-20 0 20 10m-20 12 20 10m-20 12 20 10M319 213v-80m20 80v-67m-20 0 20 10m-20 12 20 10m-20 12 20 10" stroke="#6b5136" strokeWidth="7" />
      <path d="m-50 133 7-20 7 20m353 0 7-20 7 20M-51 183l8-21 8 21m353 0 8-21 8 21" fill="#87919a" stroke="#4b4d4a" strokeWidth="3" />
      <g transform="translate(114 36)"><path d="M0 0h70v44H0Z" fill="#874b43" stroke="#543a36" strokeWidth="4" /><path d="M9 10h52M9 20h52M9 30h52" stroke="#d5ba83" strokeWidth="3" /><path d="M35 44v48" stroke="#705339" strokeWidth="5" /></g>
      <g transform="translate(48 138)"><path d="M0 0h61v43H0Z" fill="#775c40" stroke="#4f4739" strokeWidth="4" /><path d="M8 0v43m13-43v43m13-43v43m13-43v43" stroke="#c5a16b" strokeWidth="3" /><path d="M-4 10h68M-4 32h68" stroke="#4f4739" strokeWidth="4" /></g>
      <g transform="translate(206 143)"><path d="M0 28q-8-28 17-37 25 9 16 37Z" fill="#ad613e" stroke="#68463a" strokeWidth="4" /><path d="M17-4v37m-13-26 13 9 13-9" fill="none" stroke="#e1ae65" strokeWidth="4" /><path d="M17-11v-12" stroke="#594736" strokeWidth="4" /></g>
      <text x="144" y="276" textAnchor="middle">TRẠM CANH · CHỐT CHẶN CẦU GỖ</text>
    </g>
  </g>;
}
