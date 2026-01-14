import React from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const WeightRecencySettings = ({ weightRecencyToggle, toggleWeightRecency, usePdfOnly, processingUserQuery, alphaValue, handleAlphaRangeChange, yearSelectedOption, handleOptionChange, singleYear, setSingleYear, yearRange, setYearRange, pastYears, setPastYears }) => {
    return (
        <div className={`weight-recency-toggle-box ${weightRecencyToggle ? 'expanded' : ''}`}>
            <div className="weight-recency-switch-container">
                <span className="weight-recency-label">Weight by Recency</span>
                <label className={`weight-recency-toggle ${!usePdfOnly ? 'disabled' : ''}`} >
                    <input type="checkbox"
                        checked={weightRecencyToggle}
                        onChange={toggleWeightRecency}
                        disabled={!usePdfOnly || processingUserQuery}
                    />
                    <span className="slider round"></span>
                </label>
            </div>

            {weightRecencyToggle && (
                <div className="recency-options">
                    <div className="recenc-range-slider-container">
                        <label htmlFor="alphaRange" className="recency-range-slider-label">
                            Alpha Value: {alphaValue}
                        </label>
                        <input
                            id="alphaRange"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={alphaValue}
                            onChange={handleAlphaRangeChange}
                            disabled={processingUserQuery}
                            className="recency-range-slider"
                        />
                    </div>

                    <div className="dropdown-container">
                        <label htmlFor="recencyOption">Year Selection:</label>
                        <select id="recencyOption" value={yearSelectedOption} onChange={handleOptionChange} disabled={processingUserQuery}>
                            <option value="none">None</option>
                            <option value="option1">Select Specific Year</option>
                            <option value="option2">Select Year Range</option>
                            <option value="option3">Select Past Few Years</option>
                        </select>
                    </div>

                    {yearSelectedOption === "option1" && (
                        <div className="input-container">
                            <label htmlFor="singleYear">Year:</label>
                            <DatePicker
                                id="singleYear"
                                selected={singleYear}
                                onChange={(date) => setSingleYear(date)}
                                disabled={processingUserQuery}
                                showYearPicker
                                dateFormat="yyyy"
                                maxDate={new Date()}
                                placeholderText="Select Year"
                                className="year-picker-input"
                                onKeyDown={(e) => e.preventDefault()}
                                autoComplete="off"
                                shouldCloseOnSelect={true}
                            />
                        </div>
                    )}

                    {yearSelectedOption === "option2" && (
                        <div className="input-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="date-field">
                                <label htmlFor="startYear" style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>START:</label>
                                <DatePicker
                                    id="startYear"
                                    selected={yearRange.startYear ? new Date(yearRange.startYear, 0, 1) : null}
                                    onChange={(date) => setYearRange(prev => ({ ...prev, startYear: date.getFullYear() }))}
                                    showYearPicker
                                    dateFormat="yyyy"
                                    maxDate={new Date()}
                                    disabled={processingUserQuery}
                                    className="year-picker-input"
                                    onKeyDown={(e) => e.preventDefault()}
                                    autoComplete="off"
                                    shouldCloseOnSelect={true}
                                />
                            </div>
                            <div className="date-field">
                                <label htmlFor="endYear" style={{ display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>END:</label>
                                <DatePicker
                                    id="endYear"
                                    selected={yearRange.endYear ? new Date(yearRange.endYear, 0, 1) : null}
                                    onChange={(date) => setYearRange(prev => ({ ...prev, endYear: date.getFullYear() }))}
                                    showYearPicker
                                    dateFormat="yyyy"
                                    minDate={yearRange.startYear ? new Date(yearRange.startYear, 0, 1) : null}
                                    maxDate={new Date(new Date().getFullYear(), 11, 31)}
                                    disabled={processingUserQuery || !yearRange.startYear}
                                    className="year-picker-input"
                                    onKeyDown={(e) => e.preventDefault()}
                                    autoComplete="off"
                                    shouldCloseOnSelect={true}
                                    placeholderText={!yearRange.startYear ? "Select Start Year First" : "Select End Year"}
                                />
                            </div>
                        </div>
                    )}

                    {yearSelectedOption === "option3" && (
                        <div className="input-container">
                            <label htmlFor="pastYears">Past 'X' Years:</label>
                            <input
                                id="pastYears"
                                type="number"
                                value={pastYears}
                                disabled={processingUserQuery}
                                onChange={(e) => setPastYears(e.target.value)}
                                className="year-picker-input"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WeightRecencySettings;
