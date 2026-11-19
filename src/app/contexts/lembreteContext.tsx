'use client'

import { createContext, ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { apiRequest, ApiError } from "../utils/api";
import { getSessionIdentity } from '../utils/session-storage';
import RequestFeedback from "../components/RequestFeedback/RequestFeedback";
import { requestErrorMessage, RequestContractError } from "../utils/request-errors";
import { publishNavigationFeedback } from "../utils/navigation-feedback";

import { useAuth } from "./AuthContext";

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
    lembretes: Lembrete[];
    lembretesHoje: Lembrete[];
    getLembretes: () => Promise<boolean | void>;
    lembretesError?: string | null;
    lembretesLoading?: boolean;
    setLembretesFeedbackHost?: (host: HTMLElement | null) => void;
}

export const LembreteContext = createContext<LembreteContextType | null>(null)

export const LembreteProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const identity = !loading && isAuthenticated ? String(user?.id ?? user?.email ?? '') : '';
    const [snapshot, setSnapshot] = useState<{ identity: string; session: string | null; doses: Lembrete[]; error: string | null; loading: boolean }>({ identity: '', session: null, doses: [], error: null, loading: false });
    const session = getSessionIdentity();
    const current = Boolean(identity && snapshot.identity === identity && snapshot.session === session);
    const lembretes = current ? snapshot.doses : [];
    const lembretesError = current ? snapshot.error : null;
    const lembretesLoading = Boolean(identity && session && (!current || snapshot.loading));
    const [feedbackHost, setLembretesFeedbackHost] = useState<HTMLElement | null>(null);
    const version = useRef(0);
    const controller = useRef<AbortController | null>(null);

    const getLembretes = useCallback(async () => {
        if (!identity || !session) return false;
        controller.current?.abort();
        const request = new AbortController();
        controller.current = request;
        const attempt = ++version.current;
        const active = () => attempt === version.current && !request.signal.aborted && getSessionIdentity() === session;
        setSnapshot(previous => ({ identity, session, doses: previous.identity === identity && previous.session === session ? previous.doses : [], error: null, loading: true }));
        try {
            const response = await apiRequest<{ data: Lembrete[] }>('dose/me', {
                method: 'GET', onUnauthorized: 'refresh', signal: request.signal,
            });
            if (!active()) return false;
            if (!response || !Array.isArray(response.data) || !response.data.every(dose => dose && typeof dose.id === 'number' && Number.isFinite(dose.id) && typeof dose.tomado === 'boolean' && typeof dose.data_dose === 'string' && !Number.isNaN(new Date(dose.data_dose).getTime()) && dose.remedio && typeof dose.remedio.nome === 'string' && typeof dose.remedio.quantidadeDose === 'string' && typeof dose.remedio.cor === 'string')) throw new RequestContractError();
            setSnapshot({ identity, session, doses: response.data, error: null, loading: false });
            return true;
        } catch (error) {
            if (!active()) return false;
            if (error instanceof ApiError && error.status === 401) {
                setSnapshot({ identity: '', session: null, doses: [], error: null, loading: false });
                logout();
                publishNavigationFeedback('session-expired');
            } else {
                setSnapshot(previous => ({ ...previous, error: requestErrorMessage(error), loading: false }));
            }
            return false;
        }
    }, [identity, session, logout]);

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
