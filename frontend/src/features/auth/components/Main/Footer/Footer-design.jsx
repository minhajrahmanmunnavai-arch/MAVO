import React from 'react'
import { Link } from 'react-router-dom'
import Lumina from './Lumina-Details'
import AboutUs from './AboutUs'
import Navigation from './Navigation'
import CustomerCare from './CustomerCare'
import Account from './Account'

const FooterDesign = () => {
    return (
        <section className='px-37 pb-8  '>
            <div className='pt-15 pb-8 flex justify-between'>
                <Lumina />
                <AboutUs />
                <Navigation />
                <CustomerCare />
                <Account />
            </div>
            <div className='flex justify-between text-gray-400'>
                <p className='text-[14px] text-gray-300'>
                    &copy; 2026 Minhaj Rahman Inc. All rights reserved.
                </p>
                <div className='flex  justify-between gap-7'>
                    <Link className='hover:text-gray-200' to='/privacy'>Privacy Policy</Link>
                    <Link className='hover:text-gray-200' to='/terms'>Terms of Service</Link>
                    <Link className='hover:text-gray-200' to=''>Shipping & Returns</Link>
                </div>
            </div>
        </section>
    )
}

export default FooterDesign