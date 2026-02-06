import { type Scope } from '../types';
import { CATEGORY_SETTINGS } from '../utils/categoryConfig';

type ScopeRange = Omit<Scope, 'category'>;

const SCOPE_RANGES_BY_CATEGORY: Record<Scope['category'], ScopeRange[]> = {
    'ことわざ': [
        { id: '42A-02', startPage: 12, endPage: 16 },
        { id: '42A-03', startPage: 17, endPage: 21 },
        { id: '42A-04', startPage: 22, endPage: 27 },
        { id: '42A-21', startPage: 28, endPage: 33 }
    ],
    '慣用句': [
        { id: '42A-05', startPage: 50, endPage: 52 },
        { id: '42A-06', startPage: 53, endPage: 56 },
        { id: '42A-07', startPage: 57, endPage: 59 },
        { id: '42A-08', startPage: 60, endPage: 63 },
        { id: '42A-23', startPage: 64, endPage: 67 },
        { id: '42A-24', startPage: 68, endPage: 71 },
        { id: '42A-25', startPage: 72, endPage: 74 },
        { id: '42A-26', startPage: 75, endPage: 77 }
    ],
    '類義語': [
        { id: '42A-09', startPage: 88, endPage: 89 },
        { id: '42A-10', startPage: 90, endPage: 91 }
    ],
    '対義語': [
        { id: '42A-11', startPage: 92, endPage: 93 },
        { id: '42A-12', startPage: 94, endPage: 95 },
        { id: '42A-27', startPage: 96, endPage: 97 },
        { id: '42A-28', startPage: 98, endPage: 100 }
    ],
    '四字熟語': [
        { id: '42A-13', startPage: 103, endPage: 106 },
        { id: '42A-14', startPage: 107, endPage: 110 },
        { id: '42A-30', startPage: 111, endPage: 114 },
        { id: '42A-31', startPage: 115, endPage: 118 }
    ],
    '三字熟語': [
        { id: '42A-15', startPage: 119, endPage: 121 },
        { id: '42A-16', startPage: 122, endPage: 124 },
        { id: '42A-32', startPage: 125, endPage: 127 },
        { id: '42A-33', startPage: 128, endPage: 130 }
    ],
    '同音異義語': [
        { id: '42A-17', startPage: 144, endPage: 146 },
        { id: '42A-18', startPage: 147, endPage: 150 },
        { id: '42A-34', startPage: 151, endPage: 153 },
        { id: '42A-35', startPage: 154, endPage: 157 },
        { id: '42A-36', startPage: 163, endPage: 165 }
    ],
    '同訓異字': [
        { id: '42A-19', startPage: 158, endPage: 159 },
        { id: '42A-20', startPage: 160, endPage: 162 }
    ],
    '似た意味のことわざ': [
        { id: '42A-22', startPage: 34, endPage: 36 }
    ],
    '対になることわざ': [
        { id: '42A-22-2', displayId: '42A-22', startPage: 37, endPage: 39 }
    ],
    '上下で対となる熟語': [
        { id: '42A-29', startPage: 101, endPage: 102 }
    ]
};

const buildScopes = (): Scope[] => {
    const scopes: Scope[] = [];
    for (const category of Object.keys(SCOPE_RANGES_BY_CATEGORY) as Scope['category'][]) {
        const ranges = SCOPE_RANGES_BY_CATEGORY[category];
        for (const range of ranges) {
            scopes.push({ ...range, category });
        }
    }

    return scopes.sort((a, b) => a.id.localeCompare(b.id, 'ja', { numeric: true }));
};

const validateScopes = (scopes: Scope[]) => {
    for (const scope of scopes) {
        if (scope.startPage > scope.endPage) {
            throw new Error(`Invalid scope range: ${scope.id} (${scope.startPage}-${scope.endPage})`);
        }
        if (!CATEGORY_SETTINGS[scope.category]) {
            throw new Error(`Unknown category in scope: ${scope.id} (${scope.category})`);
        }
    }

    for (let i = 0; i < scopes.length; i++) {
        for (let j = i + 1; j < scopes.length; j++) {
            const a = scopes[i];
            const b = scopes[j];
            const overlaps = a.startPage <= b.endPage && b.startPage <= a.endPage;
            if (overlaps) {
                throw new Error(`Scope pages overlap: ${a.id} (${a.startPage}-${a.endPage}) and ${b.id} (${b.startPage}-${b.endPage})`);
            }
        }
    }
};

export const SCOPES: Scope[] = buildScopes();

validateScopes(SCOPES);

const SCOPE_BY_ID = new Map<string, Scope>(SCOPES.map(scope => [scope.id, scope]));

const SCOPE_BY_PAGE = new Map<number, Scope>();
for (const scope of SCOPES) {
    for (let page = scope.startPage; page <= scope.endPage; page++) {
        SCOPE_BY_PAGE.set(page, scope);
    }
}

export const findScopeById = (id: string): Scope | undefined => SCOPE_BY_ID.get(id);

export const findScopeByPage = (page: number): Scope | undefined => SCOPE_BY_PAGE.get(page);
