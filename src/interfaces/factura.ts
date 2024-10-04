export interface data {
    serie: string
    folio: number
    fecha: string,
    sello: string,
    formapago: string,
    numcertificado: string,
    certificado: string,
    moneda: string,
    subtotal: number,
    total: number,
    tipocomprobante: string,
    metodopago: string,
    lugarexpedicion: string,
    emisor: {
        rfc: string,
        nombre: string,
        regimenfiscal: string
    }
    receptor: {
        rfc: string,
        nombre: string,
        regimenfiscal: string
        codigopostal: string,
        direccion: string,
        ciudad: string
    },
    conceptos: [
        {
            claveprodservicio: string,
            cantidad: number,
            claveunidad: string,
            unidad: string,
            descripcion: string,
            valorunitario: number,
            importe: number,
            objetoimpuesto: string,
            impuestos: {
                traslados: [
                    {
                        base: number;
                        impuesto: string,
                        tipofactor: string,
                        tasaocuota: number,
                        importe: number
                    }

                ]
            }
        }
    ],
    impuestos: {
        totalimpuestostrasladados: number,
        traslados: [{
            base: number,
            impuesto: string,
            tipofactor: string,
            tasaocuota: number,
            importe: number,
        }]

    },
    complemento: {
        uuid: string;
        fechatimbrado: string,
        rfcprovcert: string,
        sellocfd: string,
        nocertificadosat: string,
        sellosat: string,
    },
    formatos: {
        modo: string,
        observaciones: string,
        email: string,
    }

}

