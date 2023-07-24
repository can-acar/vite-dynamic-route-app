import Router from "lib/router";
import React from 'react'
import ReactDOM from 'react-dom/client'

const options = {
    ext: ['jsx', 'js'],
    dirs: [{
        dir: 'src/pages',
        baseRouter: '/index',
        ext: ['jsx', 'js'],
    }, {
        dir: 'src/admin/pages',
        baseRouter: '/admin',
        ext: ['jsx', 'js'],
        
    }]
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router options={options}/>
    </React.StrictMode>,
)
