"use client"

import { useState, useEffect } from 'react'

export default function Cardbusca() {

    const [busca, setBusca] = useState('')
    const [status, setStatus] = useState('oi')

    useEffect(() => {
        if (busca === '') {
            
        }
    }
    )

    return (
        <>
            <div className="grid grid-rows-3">
                <div>
                    <input type="text" placeholder="Buscar medicamento" className="max-w-screen m-5" />
                </div>
                <div>
                    <p className="m-5">oi</p>
                </div>
            </div>
        </>
    )
}