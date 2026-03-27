import {create} from 'zustand';


export const solanaBalenceStore = create<solanaBalenceStore>((set) => ({
    balences : {},
    setBalences : (balences) => set({balences : balences}),
    updateSolanaBalences : (pubKey,balence) => set((state) => ({
        balences : {
            ...state.balences,
            [pubKey] : balence,
        }
    })),
}));

interface solanaBalenceStore {
    balences : Record<string,number>,
    setBalences : (balences : Record<string,number>) => void,
    updateSolanaBalences : (pubKey :string,balence :number ) => void,
}
