(function () {
    'use strict';

    const GROUPS = {
        threat: ['sl', 'mo', 'op', 'si'],
        vuln:   ['ed', 'ee', 'aw', 'id_det'],
        tech:   ['lc', 'li_', 'la', 'lac'],
        biz:    ['fd', 'rd', 'nc', 'pv'],
    };

    const DEFAULTS = {
        sl: 5, mo: 4, op: 7, si: 6,
        ed: 7, ee: 5, aw: 4, id_det: 3,
        lc: 6, li_: 3, la: 5, lac: 7,
        fd: 3, rd: 4, nc: 5, pv: 5,
    };

    const RISK_MATRIX = {
        LOW:    { LOW: 'NOTE',   MEDIUM: 'LOW',    HIGH: 'MEDIUM'   },
        MEDIUM: { LOW: 'LOW',    MEDIUM: 'MEDIUM', HIGH: 'HIGH'     },
        HIGH:   { LOW: 'MEDIUM', MEDIUM: 'HIGH',   HIGH: 'CRITICAL' },
    };

    const RISK_COLORS = {
        NOTE:     '#33ff00',
        LOW:      '#aaff00',
        MEDIUM:   '#ffcc00',
        HIGH:     '#ff6600',
        CRITICAL: '#ff3333',
    };

    function avg(ids) {
        const vals = ids.map(id => parseFloat(document.getElementById(id).value));
        return vals.reduce((a, b) => a + b, 0) / vals.length;
    }

    function level(score) {
        if (score < 3) return { label: 'LOW',    color: '#33ff00' };
        if (score < 6) return { label: 'MEDIUM', color: '#ffcc00' };
        return             { label: 'HIGH',   color: '#ff6600' };
    }

    function bar(score) {
        const filled = Math.round((score / 9) * 18);
        return '█'.repeat(filled) + '░'.repeat(18 - filled);
    }

    function pad(n) {
        return n.toFixed(2).padStart(4);
    }

    function calculate() {
        const tAgent = avg(GROUPS.threat);
        const tVuln  = avg(GROUPS.vuln);
        const tTech  = avg(GROUPS.tech);
        const tBiz   = avg(GROUPS.biz);

        const likelihood = (tAgent + tVuln) / 2;
        const impact     = Math.max(tTech, tBiz);

        const lLevel = level(likelihood);
        const iLevel = level(impact);
        const techLv = level(tTech);
        const bizLv  = level(tBiz);

        const riskLabel = RISK_MATRIX[lLevel.label][iLevel.label];
        const riskColor = RISK_COLORS[riskLabel];

        document.getElementById('avg-threat').textContent = `avg: ${tAgent.toFixed(2)}`;
        document.getElementById('avg-vuln').textContent   = `avg: ${tVuln.toFixed(2)}`;
        document.getElementById('avg-tech').textContent   = `avg: ${tTech.toFixed(2)}`;
        document.getElementById('avg-biz').textContent    = `avg: ${tBiz.toFixed(2)}`;

        document.getElementById('result-output').innerHTML = [
            `  <span style="color:rgba(51,255,0,0.6)">// LIKELIHOOD</span>`,
            `  Threat Agent    ${pad(tAgent)}  [${bar(tAgent)}]`,
            `  Vulnerability   ${pad(tVuln)}  [${bar(tVuln)}]`,
            `  <span style="color:${lLevel.color}">  Score          ${pad(likelihood)}  ──────────────────── ${lLevel.label}</span>`,
            ``,
            `  <span style="color:rgba(51,255,0,0.6)">// IMPACT</span>`,
            `  Technical       ${pad(tTech)}  [${bar(tTech)}]  <span style="color:${techLv.color}">→ ${techLv.label}</span>`,
            `  Business        ${pad(tBiz)}  [${bar(tBiz)}]  <span style="color:${bizLv.color}">→ ${bizLv.label}</span>`,
            `  <span style="color:${iLevel.color}">  Score          ${pad(impact)}  ──────────────────── ${iLevel.label}</span>`,
            ``,
            `  ${'━'.repeat(52)}`,
            `  RISK  =  <span style="color:${lLevel.color}">${lLevel.label} Likelihood</span>  ×  <span style="color:${iLevel.color}">${iLevel.label} Impact</span>`,
            `         = <span style="color:${riskColor};font-weight:bold">[ ${riskLabel} RISK ]</span>`,
        ].join('\n');
    }

    // Accordion toggle
    document.querySelectorAll('.owasp-toggle').forEach(header => {
        header.addEventListener('click', () => {
            const body = document.getElementById(header.dataset.target);
            const icon = header.querySelector('.toggle-icon');
            const open = body.style.display !== 'none';
            body.style.display = open ? 'none' : '';
            icon.textContent   = open ? '[+]' : '[-]';
        });
    });

    // Recalculate on any change
    document.querySelectorAll('#calculator select').forEach(sel => {
        sel.addEventListener('change', calculate);
    });

    // Copy report
    document.getElementById('btn-copy').addEventListener('click', () => {
        const btn  = document.getElementById('btn-copy');
        const text = document.getElementById('result-output').innerText;
        navigator.clipboard.writeText(text).then(() => {
            btn.textContent = '$ copied!';
            setTimeout(() => { btn.textContent = '$ copy report'; }, 2000);
        }).catch(() => {
            btn.textContent = '$ copy failed';
            setTimeout(() => { btn.textContent = '$ copy report'; }, 2000);
        });
    });

    // Reset to defaults
    document.getElementById('btn-reset').addEventListener('click', () => {
        Object.entries(DEFAULTS).forEach(([id, val]) => {
            document.getElementById(id).value = val;
        });
        calculate();
    });

    calculate();
})();
