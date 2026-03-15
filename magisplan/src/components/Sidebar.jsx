"use client";
import React from 'react';

export default function Sidebar() {
    return (
        <aside className='text-white'>
            <nav>
                <ul>
                    <li className="titleEx">MagisPlan</li>
                    <li>
                        <a href="#" className="active">
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <span>Calendar</span>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <span>Projects</span>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <span>Logout</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    );
}