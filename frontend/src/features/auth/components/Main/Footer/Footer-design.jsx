import React from 'react'
import { Link } from 'react-router-dom'
import Lumina from './Lumina-Details'
import AboutUs from './AboutUs'
import Navigation from './Navigation'
import CustomerCare from './CustomerCare'
import Account from './Account'

const FooterDesign = () => {
    return (
        <section className='w-full min-w-0 px-4 pb-8 sm:px-8 xl:px-37'>
            <div className='grid grid-cols-2 gap-6 pt-12 pb-8 md:grid-cols-3 xl:flex xl:justify-between xl:gap-8 xl:pt-15'>
                <Lumina />
                <AboutUs />
                <Navigation />
                <CustomerCare />
                <Account />
            </div>
            <div className='flex flex-col gap-4 text-gray-400 md:flex-row md:items-center md:justify-between'>
                <p className='text-[14px] text-gray-300'>
                    &copy; 2026 Minhaj Rahman Inc. All rights reserved.
                </p>
                <div className='flex flex-wrap gap-x-5 gap-y-2'>
                    <Link className='hover:text-gray-200' to='/privacy'>Privacy Policy</Link>
                    <Link className='hover:text-gray-200' to='/terms'>Terms of Service</Link>
                    <Link className='hover:text-gray-200' to=''>Shipping & Returns</Link>
                </div>
            </div>
        </section>
    )
}

export default FooterDesign