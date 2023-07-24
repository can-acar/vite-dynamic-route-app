import Router from "lib/router";
import React from 'react'
import ReactDOM from 'react-dom/client'

const options = {
    ext: ['jsx', 'js'],
    dirs: [{
        dir: 'src/pages',
        baseRouter: '',
        
    }, {
        dir: 'src/admin/pages',
        baseRouter: '/admin',
        isDefault: true,
    }]
}


const Loader = () => <div>Yükleniyor</div>

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router options={options} loader={Loader}/>
    </React.StrictMode>,
)
