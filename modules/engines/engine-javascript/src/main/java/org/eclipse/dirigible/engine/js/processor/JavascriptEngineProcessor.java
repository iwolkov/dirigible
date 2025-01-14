/*
 * Copyright (c) 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 * SPDX-License-Identifier: EPL-2.0
 */
package org.eclipse.dirigible.engine.js.processor;

import java.util.HashMap;
import java.util.Map;
import java.util.ServiceLoader;

import org.apache.cxf.common.util.StringUtils;
import org.eclipse.dirigible.api.v3.http.HttpRequestFacade;
import org.eclipse.dirigible.commons.api.scripting.ScriptingException;
import org.eclipse.dirigible.engine.js.api.IJavascriptEngineExecutor;
import org.eclipse.dirigible.engine.js.api.IJavascriptEngineProcessor;

/**
 * The Javascript Engine Processor.
 */
public class JavascriptEngineProcessor implements IJavascriptEngineProcessor {

    /** The Constant JAVASCRIPT_ENGINE_EXECUTORS. */
    private static final ServiceLoader<IJavascriptEngineExecutor> JAVASCRIPT_ENGINE_EXECUTORS = ServiceLoader.load(IJavascriptEngineExecutor.class);

    /** The engine executor. */
    private final IJavascriptEngineExecutor engineExecutor = new DefaultJavascriptEngineExecutor();

    /**
     * Execute service.
     *
     * @param module the module
     * @throws ScriptingException the scripting exception
     */
    /*
     * (non-Javadoc)
     * @see org.eclipse.dirigible.engine.js.api.IJavascriptEngineProcessor#executeService(java.lang.String, java.util.Map)
     */
    @Override
    public Object executeService(String module, Map<Object, Object> parameters) throws ScriptingException {
		return getEngineExecutor().executeServiceModule(module, parameters);
    }

    /**
     * Gets the engine executor.
     *
     * @return the engine executor
     */
    private IJavascriptEngineExecutor getEngineExecutor() {
        if (HttpRequestFacade.isValid()) {
            String headerEngineType = HttpRequestFacade.getHeader(IJavascriptEngineExecutor.DIRIGIBLE_JAVASCRIPT_ENGINE_TYPE_HEADER);
            if (!StringUtils.isEmpty(headerEngineType)) {
                for (IJavascriptEngineExecutor next : JAVASCRIPT_ENGINE_EXECUTORS) {
                    if (next.getType().equals(headerEngineType)) {
                        return next;
                    }
                }
            }
        }
        return engineExecutor;
    }
}
