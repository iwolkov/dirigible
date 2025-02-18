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
package org.eclipse.dirigible.commons.api.module;

import static java.text.MessageFormat.format;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.ServiceLoader;
import java.util.Set;
import java.util.stream.Collectors;

import org.eclipse.dirigible.commons.config.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The DirigibleModulesInstallerModule is the entry point of the integration.
 */
public class DirigibleModulesInstallerModule {

	/** The logger. */
	private static Logger logger = LoggerFactory.getLogger(DirigibleModulesInstallerModule.class);
	
	/** The modules. */
	private static Set<String> modules = new HashSet<String>();

	/**
	 * Configure.
	 */
	public static synchronized void configure() {
		if (logger.isDebugEnabled()) {logger.debug("Initializing Dirigible Modules...");}

		while (!Configuration.LOADED) {
			if (logger.isInfoEnabled()) {logger.info("Waiting for Dirigible Configuration to be initialized");}
			try {
				Thread.sleep(100);
			} catch (InterruptedException e) {
				// Do nothing
			}
		}

		ServiceLoader<IDirigibleModule> dirigibleModules = ServiceLoader.load(IDirigibleModule.class);

		List<IDirigibleModule> sortedDirigibleModules = new ArrayList<IDirigibleModule>();
		Iterator<IDirigibleModule> iterator = dirigibleModules.iterator();
		while(iterator.hasNext()) {
			sortedDirigibleModules.add(iterator.next());
		}
		Collections.sort(sortedDirigibleModules, new Comparator<IDirigibleModule>() {

			@Override
			public int compare(IDirigibleModule module1, IDirigibleModule module2) {
				int priorityDiff = module1.getPriority() - module2.getPriority();
				if (priorityDiff == 0) {
					priorityDiff = module1.getName().compareTo(module2.getName());
				}
				return priorityDiff;
			}
		});

		for (IDirigibleModule next: sortedDirigibleModules) {
			if (logger.isDebugEnabled()) {logger.debug(format("Installing Dirigible Module [{0}] ...", next.getName()));}
			try {
				next.configure();
			} catch (Throwable e) {
				if (logger.isErrorEnabled()) {logger.error(format("Failed installing Dirigible Module [{0}].", next.getName()), e);}
			}
			if (logger.isDebugEnabled()) {logger.debug(format("Done installing Dirigible Module [{0}].", next.getName()));}
			modules.add(next.getName());
		}
		if (logger.isDebugEnabled()) {logger.debug("Done initializing Dirigible Modules.");}
	}
	
	/**
	 * Gets the modules.
	 *
	 * @return the modules
	 */
	public static Set<String> getModules() {
		return modules.stream().collect(Collectors.toSet());
	}

}
