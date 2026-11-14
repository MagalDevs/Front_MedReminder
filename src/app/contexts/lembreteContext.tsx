'use client'

import { createContext, ReactNode, useEffect, useLayoutEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { apiRequest, ApiError } from "../utils/api";
import RequestFeedback from "../components/RequestFeedback/RequestFeedback";
import { requestErrorMessage, RequestContractError } from "../utils/request-errors";
import { publishNavigationFeedback } from "../utils/navigation-feedback";

import { useAuth } from "./AuthContext";
import { subscribeDoseConfirmations, type DoseConfirmation } from '../features/web-ux/data/dose-confirmations';
import { isDoseInstant } from '../features/web-ux/domain/agenda';

interface Lembrete {
    id: number;
    tomado: boolean;
    data_dose: Date;
    usuarioId: number;
    remedioId: number;
    remedio: {
        id: number;
        nome: string;
        classificacao: string;
        quantidadeDiaria: number;
        quantidadeCaixa: number;
        horaInicio: string;
        cor: string;
        unidadeMedida: string;
        motivo: string;
        quantidadeDias: number;
        dataValidade: string;
        foto: Blob;
        observacao: string;
        quantidadeDose: string;
        usuarioId: number;
    };
}

interface LembreteContextType {
    identityKey?: string;
    lembretes: Lembrete[];
    lembretesHoje: Lembrete[];
    getLembretes: () => Promise<boolean | void>;
    lembretesError?: string | null;
    lembretesLoading?: boolean;
    setLembretesFeedbackHost?: (host: HTMLElement | null) => void;
}

export const LembreteContext = createContext<LembreteContextType | null>(null)

export const LembreteProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated, loading, logout, identityKey } = useAuth();
    const identity = !loading && isAuthenticated ? identityKey ?? String(user?.id ?? user?.email ?? '') : '';
    const [snapshot, setSnapshot] = useState<{ identity: string; token: string | null; doses: Lembrete[]; error: string | null; loading: boolean }>({ identity: '', token: null, doses: [], error: null, loading: false });
    const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
    const current = Boolean(identity && snapshot.identity === identity && snapshot.token === token);
    const lembretes = current ? snapshot.doses : [];
    const lembretesError = current ? snapshot.error : null;
    const lembretesLoading = Boolean(identity && token && (!current || snapshot.loading));
    const [feedbackHost, setLembretesFeedbackHost] = useState<HTMLElement | null>(null);
    const version = useRef(0);
    const controller = useRef<AbortController | null>(null);
    const confirmations = useRef<DoseConfirmation[]>([]);
    useLayoutEffect(() => {
        confirmations.current = [];
        return subscribeDoseConfirmations(identity, value => {
            if (localStorage.getItem('access_token') !== token) return;
            confirmations.current.push(value);
            setSnapshot(previous => previous.identity !== identity || previous.token !== token ? previous : { ...previous, doses: previous.doses.map(dose => dose.id === value.id && new Date(dose.data_dose).getTime() === Date.parse(value.expectedAt) ? { ...dose, tomado: value.registered } : dose) });
        });
    }, [identity, token]);

    const getLembretes = useCallback(async () => {
        if (!identity || !token) return false;
        controller.current?.abort();
        const request = new AbortController();
        controller.current = request;
        const attempt = ++version.current;
        const start = confirmations.current.length;
        const active = () => attempt === version.current && !request.signal.aborted && localStorage.getItem('access_token') === token;
        setSnapshot(previous => ({ identity, token, doses: previous.identity === identity && previous.token === token ? previous.doses : [], error: null, loading: true }));
        try {
            const response = await apiRequest<{ data: Lembrete[] }>('dose/me', {
                method: 'GET', onUnauthorized: 'throw', signal: request.signal,
            });
            if (!active()) return false;
            if (!response || !Array.isArray(response.data)) throw new RequestContractError();
            const complete = response.data.filter(dose => dose && Number.isSafeInteger(dose.id) && dose.id > 0 && typeof dose.tomado === 'boolean' && isDoseInstant(dose.data_dose) && dose.remedio && typeof dose.remedio.nome === 'string' && dose.remedio.nome.trim() && typeof dose.remedio.quantidadeDose === 'string' && dose.remedio.quantidadeDose.trim() && typeof dose.remedio.cor === 'string');
            if (response.data.length && !complete.length) throw new RequestContractError();
            const doses = complete.map(dose => {
                const confirmed = confirmations.current.slice(start).findLast(value => value.id === dose.id && Date.parse(value.expectedAt) === new Date(dose.data_dose).getTime());
                return confirmed ? { ...dose, tomado: confirmed.registered } : dose;
            });
            setSnapshot({ identity, token, doses, error: null, loading: false });
            return true;
        } catch (error) {
            if (!active()) return false;
            if (error instanceof ApiError && error.status === 401) {
                setSnapshot({ identity: '', token: null, doses: [], error: null, loading: false });
                logout();
                publishNavigationFeedback('session-expired');
            } else {
                setSnapshot(previous => ({ ...previous, error: requestErrorMessage(error), loading: false }));
            }
            return false;
        }
    }, [identity, token, logout]);

    const cancelRequests = useCallback(() => {
        version.current++;
        controller.current?.abort();
    }, []);

    useEffect(() => {
        void getLembretes();
        return cancelRequests;
    }, [getLembretes, cancelRequests]);

    const lembretesHoje = lembretes.filter((lembrete) => {
        const agora = new Date();
        const fimDoDia = new Date(agora);
        fimDoDia.setHours(23, 59, 59, 999);

        const dataDose = new Date(lembrete.data_dose);

        return (
            dataDose >= agora && dataDose <= fimDoDia
        );
    });
    

    return (
        <LembreteContext.Provider value={{ 
            identityKey: identity,
            lembretesHoje,
            lembretes,
            getLembretes,
            lembretesError,
            lembretesLoading,
            setLembretesFeedbackHost
        }}>
            {lembretesError && (feedbackHost
                ? createPortal(<RequestFeedback context="Ao carregar lembretes" message={lembretesError} />, feedbackHost)
                : <RequestFeedback context="Ao carregar lembretes" message={lembretesError} />)}
            {children}
        </LembreteContext.Provider>
    );
}
